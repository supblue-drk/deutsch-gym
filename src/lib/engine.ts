import { db, type DeutschGymDB } from "./db";
import { expressions, expressionById, worlds } from "./content";
import { freshCard, localDay, schedule } from "./scheduler";
import type { CardProgress, LearningSession, Rating } from "./learning-types";

export function selectDaily(cards: CardProgress[], goal: number, now: number) {
  const map = new Map(cards.map((card) => [card.expressionId, card]));
  const due = cards
    .filter(
      (card) =>
        expressionById.has(card.expressionId) &&
        card.dueAt !== null &&
        card.dueAt <= now,
    )
    .sort(
      (a, b) =>
        a.dueAt! - b.dueAt! || a.expressionId.localeCompare(b.expressionId),
    )
    .map((card) => card.expressionId);
  // Round-robin worlds rather than filling the first day only with workplace cards.
  const groups = Object.keys(worlds).map((world) =>
    expressions.filter((item) => item.category === world),
  );
  const ordered = Array.from(
    { length: Math.max(...groups.map((group) => group.length)) },
    (_, i) => groups.flatMap((group) => (group[i] ? [group[i]] : [])),
  ).flat();
  const newIds = ordered
    .filter((item) => {
      const card = map.get(item.id);
      return !card || (card.state === "new" && card.lastReviewedAt === null);
    })
    .slice(0, goal)
    .map((item) => item.id);
  return { queue: [...new Set([...due, ...newIds])], newIds };
}
export async function openSession(
  kind: "daily" | "review",
  now = Date.now(),
  database: DeutschGymDB = db,
): Promise<LearningSession | null> {
  return database.transaction(
    "rw",
    database.preferences,
    database.cards,
    database.learningSessions,
    async () => {
      const day = localDay(now);
      const existing =
        kind === "daily"
          ? await database.learningSessions.get(`daily:${day}`)
          : (
              await database.learningSessions
                .where("kind")
                .equals("review")
                .toArray()
            ).find((session) => session.completedAt === null);
      if (existing) return existing;
      const cards = await database.cards.toArray();
      const rawGoal = Number(
        (await database.preferences.get("dailyGoal"))?.value ?? 3,
      );
      const goal = [3, 5, 10].includes(rawGoal) ? rawGoal : 3;
      const selected = selectDaily(cards, goal, now);
      const queue =
        kind === "daily"
          ? selected.queue
          : selected.queue.filter((id) => !selected.newIds.includes(id));
      if (!queue.length && kind === "review") return null;
      const session: LearningSession = {
        id: kind === "daily" ? `daily:${day}` : `review:${crypto.randomUUID()}`,
        kind,
        day,
        queue,
        newIds: kind === "daily" ? selected.newIds : [],
        cursor: 0,
        startedAt: now,
        completedAt: queue.length ? null : now,
      };
      await database.learningSessions.add(session);
      return session;
    },
  );
}
export async function rateSession(
  id: string,
  expectedCursor: number,
  rating: Rating,
  now = Date.now(),
  database: DeutschGymDB = db,
) {
  return database.transaction(
    "rw",
    database.cards,
    database.learningSessions,
    database.learningEvents,
    async () => {
      const session = await database.learningSessions.get(id);
      if (!session)
        throw new Error(
          "Die Sitzung ist nicht mehr verfügbar. Bitte neu starten.",
        );
      // A stale tap/tab cannot write a second rating or move past an unseen card.
      if (session.cursor !== expectedCursor || session.completedAt !== null)
        return session;
      const expressionId = session.queue[session.cursor];
      if (!expressionById.has(expressionId))
        throw new Error("Ausdruck nicht verfügbar.");
      const previous =
        (await database.cards.get(expressionId)) ?? freshCard(expressionId);
      await database.cards.put(schedule(previous, rating, now));
      await database.learningEvents.add({
        id: `${session.id}:${session.cursor}`,
        expressionId,
        at: now,
        day: localDay(now),
        rating,
        sessionId: session.id,
      });
      const next = {
        ...session,
        cursor: session.cursor + 1,
        completedAt: session.cursor + 1 === session.queue.length ? now : null,
      };
      await database.learningSessions.put(next);
      return next;
    },
  );
}
export async function toggleFavorite(id: string) {
  await db.transaction("rw", db.cards, async () => {
    const card = (await db.cards.get(id)) ?? freshCard(id);
    await db.cards.put({ ...card, favorite: !card.favorite });
  });
}
export async function markLearned(id: string, now = Date.now()) {
  await db.transaction("rw", db.cards, db.learningEvents, async () => {
    const card = (await db.cards.get(id)) ?? freshCard(id);
    if (card.learnedAt !== null) return;
    const learned = schedule(card, "good", now);
    // Manual marking is not a recall rating and must not inflate review counts.
    await db.cards.put({
      ...learned,
      reviewCount: card.reviewCount,
      lastReviewedAt: card.lastReviewedAt,
      lastReviewedDate: card.lastReviewedDate,
    });
    await db.learningEvents.add({
      id: `learned:${id}:${now}`,
      expressionId: id,
      at: now,
      day: localDay(now),
      rating: null,
      sessionId: null,
    });
  });
}
