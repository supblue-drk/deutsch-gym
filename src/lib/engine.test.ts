import { afterEach, expect, it } from "vitest";
import { DeutschGymDB, initializeDatabase } from "./db";
import { openSession, rateSession, selectDaily } from "./engine";
import { freshCard, schedule } from "./scheduler";
const database = new DeutschGymDB("engine-test");
const now = new Date(2026, 9, 30, 12).getTime();
afterEach(async () => {
  await database.delete();
});
it("prioritizes due cards and balances unseen expressions without repeating learned/mastered ones", () => {
  const due = schedule(freshCard("work-001"), "good", now - 3 * 86400000);
  const mastered = {
    ...schedule(freshCard("life-001"), "easy", now),
    state: "mastered" as const,
    interval: 21,
  };
  const selected = selectDaily([due, mastered], 3, now);
  expect(selected.queue[0]).toBe("work-001");
  expect(selected.newIds).toHaveLength(3);
  expect(selected.newIds).not.toContain("work-001");
  expect(selected.queue).not.toContain("life-001");
  expect(new Set(selected.queue).size).toBe(selected.queue.length);
});
it("completes three new expressions, resumes, and saves ratings exactly once", async () => {
  await initializeDatabase(database);
  let session = (await openSession("daily", now, database))!;
  expect(session.newIds).toHaveLength(3);
  await Promise.all([
    rateSession(session.id, 0, "good", now, database),
    rateSession(session.id, 0, "good", now, database),
  ]);
  database.close();
  await database.open();
  session = (await openSession("daily", now, database))!;
  expect(session.cursor).toBe(1);
  for (let index = 1; index < 3; index++)
    session = await rateSession(
      session.id,
      index,
      "good",
      now + index,
      database,
    );
  expect(session.completedAt).not.toBeNull();
  expect(await database.cards.count()).toBe(3);
  expect(await database.learningEvents.count()).toBe(3);
  expect(
    (await database.cards.toArray()).every(
      (card) => card.learnedAt !== null && card.reviewCount === 1,
    ),
  ).toBe(true);
  const review = await openSession("review", now + 86400000, database);
  expect(review?.queue).toHaveLength(3);
  for (let index = 0; index < 3; index++)
    await rateSession(review!.id, index, "easy", now + 86400000, database);
  expect(await openSession("review", now + 86400000, database)).toBeNull();
  expect(await database.cards.count()).toBe(3);
});
it("honors goals and freezes an interrupted daily queue", async () => {
  await initializeDatabase(database);
  await database.preferences.put({ key: "dailyGoal", value: "5" });
  const first = (await openSession("daily", now, database))!;
  expect(first.newIds).toHaveLength(5);
  await database.preferences.put({ key: "dailyGoal", value: "10" });
  expect((await openSession("daily", now, database))?.queue).toEqual(
    first.queue,
  );
  expect(
    (await openSession("daily", now + 86400000, database))?.newIds,
  ).toHaveLength(10);
});
it("does not partially save a rating when its event conflicts", async () => {
  await initializeDatabase(database);
  const session = (await openSession("daily", now, database))!;
  await database.learningEvents.add({
    id: `${session.id}:0`,
    expressionId: session.queue[0],
    at: now,
    day: session.day,
    rating: "good",
    sessionId: session.id,
  });
  await expect(
    rateSession(session.id, 0, "good", now, database),
  ).rejects.toThrow();
  expect(await database.cards.count()).toBe(0);
  expect((await database.learningSessions.get(session.id))?.cursor).toBe(0);
});
