import { afterEach, describe, expect, it } from "vitest";
import { DeutschGymDB, initializeDatabase } from "./db";
const database = new DeutschGymDB("deutsch-gym-test");
afterEach(async () => {
  await database.delete();
});
describe("database v1", () => {
  it("initializes all stores without fabricating learning data", async () => {
    await initializeDatabase(database);
    expect(database.verno).toBe(1);
    expect(await database.preferences.get("theme")).toEqual({
      key: "theme",
      value: "system",
    });
    for (const table of [
      database.learningItems,
      database.sessions,
      database.reviews,
    ])
      expect(await table.count()).toBe(0);
  });
  it("preserves preferences and data across initialization and reopening", async () => {
    await initializeDatabase(database);
    await database.preferences.put({ key: "theme", value: "dark" });
    await database.sessions.add({
      id: "test-session",
      completedAt: 1,
      durationSeconds: 30,
    });
    database.close();
    await initializeDatabase(database);
    await initializeDatabase(database);
    expect((await database.preferences.get("theme"))?.value).toBe("dark");
    expect(await database.sessions.count()).toBe(1);
  });
});
