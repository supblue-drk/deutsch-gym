import {
  db,
  type DeutschGymDB,
  type Preference,
  type LearningItem,
  type Session,
  type ReviewItem,
} from "./db";
import type {
  CardProgress,
  LearningSession,
  LearningEvent,
} from "./learning-types";
import { expressionById } from "./content";
export interface Backup {
  app: "deutsch-gym";
  version: 1;
  schemaVersion: 2;
  exportedAt: number;
  preferences: Preference[];
  cards: CardProgress[];
  learningSessions: LearningSession[];
  learningEvents: LearningEvent[];
  legacy: {
    learningItems: LearningItem[];
    sessions: Session[];
    reviews: ReviewItem[];
  };
}
const fail = () => {
  throw new Error(
    "Ungültige Sicherung. Bitte eine unveränderte Deutsch-Gym-JSON-Datei wählen.",
  );
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail();
  return value as Record<string, unknown>;
}
function string(value: unknown) {
  if (typeof value !== "string" || value.length > 5000) return fail();
  return value;
}
function number(value: unknown, integer = false) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 8.64e15 ||
    (integer && !Number.isInteger(value))
  )
    return fail();
  return value;
}
function nullableTime(value: unknown) {
  if (value !== null) number(value, true);
}
function day(value: unknown) {
  const text = string(value);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
    new Date(text + "T12:00:00Z").toISOString().slice(0, 10) !== text
  )
    fail();
}
function rows(value: unknown, key: string) {
  if (!Array.isArray(value) || value.length > 100000) return fail();
  const seen = new Set();
  return value.map((entry) => {
    const row = object(entry);
    const id = string(row[key]);
    if (!id || seen.has(id)) fail();
    seen.add(id);
    return row;
  });
}
function known(value: unknown) {
  if (!expressionById.has(string(value))) fail();
}
function ids(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length > 1000 ||
    new Set(value).size !== value.length
  )
    return fail();
  value.forEach(known);
  return value as string[];
}
export function validateBackup(value: unknown): Backup {
  const backup = object(value);
  if (
    backup.app !== "deutsch-gym" ||
    backup.version !== 1 ||
    backup.schemaVersion !== 2
  )
    fail();
  number(backup.exportedAt, true);
  rows(backup.preferences, "key").forEach((pref) => {
    string(pref.value);
    if (
      pref.key === "theme" &&
      !["system", "light", "dark"].includes(pref.value as string)
    )
      fail();
    if (
      pref.key === "dailyGoal" &&
      !["3", "5", "10"].includes(pref.value as string)
    )
      fail();
  });
  const cards = rows(backup.cards, "expressionId");
  const cardIds = new Set(cards.map((card) => card.expressionId));
  cards.forEach((card) => {
    known(card.expressionId);
    if (
      typeof card.favorite !== "boolean" ||
      !["new", "learning", "review", "mastered"].includes(card.state as string)
    )
      fail();
    [card.learnedAt, card.lastReviewedAt, card.dueAt].forEach(nullableTime);
    if (card.lastReviewedDate !== null) day(card.lastReviewedDate);
    if (card.nextReviewDate !== null) day(card.nextReviewDate);
    number(card.reviewCount, true);
    number(card.lapseCount, true);
    number(card.interval, true);
    if ((card.interval as number) > 365) fail();
    number(card.ease);
    if (
      (card.ease as number) < 1.3 ||
      (card.ease as number) > 3 ||
      (card.lapseCount as number) > (card.reviewCount as number)
    )
      fail();
    if (
      card.state === "new" &&
      (card.learnedAt !== null ||
        card.lastReviewedAt !== null ||
        card.dueAt !== null ||
        card.reviewCount !== 0)
    )
      fail();
    if (
      card.state !== "new" &&
      (card.dueAt === null || card.nextReviewDate === null)
    )
      fail();
    if (
      card.state === "mastered" &&
      (card.learnedAt === null || (card.interval as number) < 21)
    )
      fail();
  });
  const sessions = rows(backup.learningSessions, "id");
  const sessionIds = new Set(sessions.map((session) => session.id));
  sessions.forEach((session) => {
    if (!["daily", "review"].includes(session.kind as string)) fail();
    day(session.day);
    const queue = ids(session.queue);
    const newIds = ids(session.newIds);
    if (newIds.some((id) => !queue.includes(id))) fail();
    number(session.cursor, true);
    number(session.startedAt, true);
    nullableTime(session.completedAt);
    if (
      (session.cursor as number) > queue.length ||
      (session.completedAt === null) !==
        (session.cursor as number) < queue.length
    )
      fail();
    if (session.kind === "daily" && session.id !== `daily:${session.day}`)
      fail();
    if (session.kind === "review" && newIds.length) fail();
  });
  if (
    sessions.filter(
      (session) => session.kind === "review" && session.completedAt === null,
    ).length > 1
  )
    fail();
  const events = rows(backup.learningEvents, "id");
  events.forEach((event) => {
    if (!cardIds.has(event.expressionId)) fail();
    known(event.expressionId);
    number(event.at, true);
    day(event.day);
    if (
      event.rating !== null &&
      !["again", "hard", "good", "easy"].includes(event.rating as string)
    )
      fail();
    if (event.sessionId !== null && !sessionIds.has(string(event.sessionId)))
      fail();
  });
  const eventMap = new Map(events.map((event) => [event.id, event]));
  for (const session of sessions) {
    for (let index = 0; index < (session.cursor as number); index++) {
      const event = eventMap.get(`${session.id}:${index}`);
      if (
        !event ||
        event.expressionId !== (session.queue as string[])[index] ||
        event.sessionId !== session.id ||
        event.rating === null
      )
        fail();
    }
  }
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  for (const event of events) {
    if (event.sessionId === null) {
      if (event.rating !== null) fail();
      continue;
    }
    const session = sessionMap.get(event.sessionId)!;
    const index = Number(
      String(event.id).slice(String(event.sessionId).length + 1),
    );
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= (session.cursor as number) ||
      event.id !== `${event.sessionId}:${index}` ||
      event.expressionId !== (session.queue as string[])[index]
    )
      fail();
  }
  const legacy = object(backup.legacy);
  rows(legacy.learningItems, "id").forEach((item) => {
    string(item.title);
    number(item.createdAt);
  });
  rows(legacy.sessions, "id").forEach((session) => {
    number(session.completedAt);
    number(session.durationSeconds);
  });
  rows(legacy.reviews, "id").forEach((review) => {
    string(review.learningItemId);
    number(review.dueAt);
  });
  return structuredClone(value) as Backup;
}
export async function exportBackup(
  database: DeutschGymDB = db,
): Promise<Backup> {
  return database.transaction("r", database.tables, async () => ({
    app: "deutsch-gym",
    version: 1,
    schemaVersion: 2,
    exportedAt: Date.now(),
    preferences: await database.preferences.toArray(),
    cards: await database.cards.toArray(),
    learningSessions: await database.learningSessions.toArray(),
    learningEvents: await database.learningEvents.toArray(),
    legacy: {
      learningItems: await database.learningItems.toArray(),
      sessions: await database.sessions.toArray(),
      reviews: await database.reviews.toArray(),
    },
  }));
}
export async function importBackup(
  value: unknown,
  database: DeutschGymDB = db,
) {
  const backup = validateBackup(value); // Validate everything before any mutation.
  await database.transaction("rw", database.tables, async () => {
    for (const table of database.tables) await table.clear();
    await database.preferences.bulkPut(backup.preferences);
    await database.cards.bulkPut(backup.cards);
    await database.learningSessions.bulkPut(backup.learningSessions);
    await database.learningEvents.bulkPut(backup.learningEvents);
    await database.learningItems.bulkPut(backup.legacy.learningItems);
    await database.sessions.bulkPut(backup.legacy.sessions);
    await database.reviews.bulkPut(backup.legacy.reviews);
    if (!(await database.preferences.get("theme")))
      await database.preferences.put({ key: "theme", value: "system" });
    if (!(await database.preferences.get("dailyGoal")))
      await database.preferences.put({ key: "dailyGoal", value: "3" });
  });
}
export async function resetProgress(database: DeutschGymDB = db) {
  await database.transaction("rw", database.tables, async () => {
    // Bundled content is immutable source data, never a table to clear.
    for (const table of database.tables)
      if (table.name !== "preferences") await table.clear();
  });
}
