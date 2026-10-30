import { afterEach, expect, it } from "vitest";
import { DeutschGymDB, initializeDatabase } from "./db";
import {
  exportBackup,
  importBackup,
  resetProgress,
  validateBackup,
} from "./backup";
import { openSession, rateSession } from "./engine";
import { expressions } from "./content";
const database = new DeutschGymDB("backup-test");
afterEach(async () => {
  await database.delete();
});
async function populated() {
  await initializeDatabase(database);
  await database.preferences.put({ key: "dailyGoal", value: "5" });
  await database.learningItems.put({
    id: "legacy",
    title: "Phase 1",
    createdAt: 1,
  });
  const session = (await openSession(
    "daily",
    new Date(2026, 9, 30, 12).getTime(),
    database,
  ))!;
  await rateSession(session.id, 0, "good", session.startedAt, database);
  return exportBackup(database);
}
it("round-trips all progress, interrupted sessions, preferences and legacy data", async () => {
  const original = await populated();
  expect(validateBackup(JSON.parse(JSON.stringify(original)))).toEqual(
    original,
  );
  await resetProgress(database);
  expect(await database.cards.count()).toBe(0);
  expect((await database.preferences.get("dailyGoal"))?.value).toBe("5");
  expect(expressions).toHaveLength(60);
  await importBackup(original, database);
  const restored = await exportBackup(database);
  expect({ ...restored, exportedAt: original.exportedAt }).toEqual(original);
  expect(
    (
      await openSession(
        "daily",
        original.learningSessions[0].startedAt,
        database,
      )
    )?.cursor,
  ).toBe(1);
});
it.each([
  "format",
  "duplicate",
  "unknown",
  "rating",
  "state",
  "cursor",
  "date",
  "settings",
])("rejects invalid %s before changing stored data", async (reason) => {
  const original = await populated();
  const bad = structuredClone(original);
  if (reason === "format") bad.version = 99 as 1;
  if (reason === "duplicate") bad.cards.push(bad.cards[0]);
  if (reason === "unknown") bad.cards[0].expressionId = "not-in-library";
  if (reason === "rating") bad.learningEvents[0].rating = "invalid" as "good";
  if (reason === "state") bad.cards[0].ease = 0;
  if (reason === "cursor") bad.learningSessions[0].cursor = 999;
  if (reason === "date") bad.learningEvents[0].day = "2026-02-30";
  if (reason === "settings")
    bad.preferences.push({ key: "dailyGoal", value: "99" });
  await expect(importBackup(bad, database)).rejects.toThrow();
  const after = await exportBackup(database);
  expect({ ...after, exportedAt: original.exportedAt }).toEqual(original);
});
it("rejects incomplete or foreign backups", () => {
  for (const input of [
    null,
    [],
    { app: "other" },
    { app: "deutsch-gym", version: 1, schemaVersion: 2, exportedAt: 1 },
  ])
    expect(() => validateBackup(input)).toThrow();
});
