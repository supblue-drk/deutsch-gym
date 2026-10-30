import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { db, type Preference } from "./db";
import type {
  CardProgress,
  LearningSession,
  LearningEvent,
} from "./learning-types";
export interface LearningData {
  cards: CardProgress[];
  sessions: LearningSession[];
  events: LearningEvent[];
  preferences: Preference[];
}
export function useLearningData() {
  const [data, setData] = useState<LearningData | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const query = liveQuery(() =>
      db.transaction(
        "r",
        db.cards,
        db.learningSessions,
        db.learningEvents,
        db.preferences,
        async () => ({
          cards: await db.cards.toArray(),
          sessions: await db.learningSessions.toArray(),
          events: await db.learningEvents.toArray(),
          preferences: await db.preferences.toArray(),
        }),
      ),
    );
    const subscription = query.subscribe({
      next: (value) => {
        setData(value);
        setError("");
      },
      error: () =>
        setError(
          "Lokale Daten konnten nicht geladen werden. Bitte die App neu öffnen; keine Website-Daten löschen.",
        ),
    });
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return { data, error, now };
}
