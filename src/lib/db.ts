import Dexie, { type Table } from "dexie";
import type {
  CardProgress,
  LearningSession,
  LearningEvent,
} from "./learning-types";
export type Theme = "system" | "light" | "dark";
export interface Preference {
  key: string;
  value: string;
}
export interface LearningItem {
  id: string;
  title: string;
  createdAt: number;
}
export interface Session {
  id: string;
  completedAt: number;
  durationSeconds: number;
}
export interface ReviewItem {
  id: string;
  learningItemId: string;
  dueAt: number;
}

export class DeutschGymDB extends Dexie {
  preferences!: Table<Preference, string>;
  learningItems!: Table<LearningItem, string>;
  sessions!: Table<Session, string>;
  reviews!: Table<ReviewItem, string>;
  cards!: Table<CardProgress, string>;
  learningSessions!: Table<LearningSession, string>;
  learningEvents!: Table<LearningEvent, string>;
  constructor(name = "deutsch-gym") {
    super(name);
    // Append future versions; never rewrite a released schema.
    this.version(1).stores({
      preferences: "&key",
      learningItems: "&id, createdAt",
      sessions: "&id, completedAt",
      reviews: "&id, learningItemId, dueAt",
    });
    // Additive migration: keep all v1 stores, keys and user records untouched.
    this.version(2).stores({
      cards: "&expressionId, dueAt, state",
      learningSessions: "&id, day, kind",
      learningEvents: "&id, day, at, sessionId",
    });
  }
}
export const db = new DeutschGymDB();
export async function initializeDatabase(database = db) {
  await database.open();
  await database.transaction("rw", database.preferences, async () => {
    if (!(await database.preferences.get("theme")))
      await database.preferences.put({ key: "theme", value: "system" });
    if (!(await database.preferences.get("dailyGoal")))
      await database.preferences.put({ key: "dailyGoal", value: "3" });
  });
}
