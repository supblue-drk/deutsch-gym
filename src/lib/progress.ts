import { expressions } from "./content";
import type { LearningData } from "./useLearningData";
import { dayOffset, dayStart, localDay } from "./scheduler";
export function calculateStreak(days: string[], today: string) {
  const active = new Set(days);
  let cursor = active.has(today) ? today : dayOffset(today, -1);
  let count = 0;
  while (active.has(cursor)) {
    count++;
    cursor = dayOffset(cursor, -1);
  }
  return count;
}
export function progressMetrics(data: LearningData, now: number) {
  const today = localDay(now);
  const tomorrow = dayStart(dayOffset(today, 1));
  return {
    learned: data.cards.filter((card) => card.learnedAt !== null).length,
    mastered: data.cards.filter((card) => card.state === "mastered").length,
    dueToday: data.cards.filter(
      (card) => card.dueAt !== null && card.dueAt < tomorrow,
    ).length,
    dueNow: data.cards.filter(
      (card) => card.dueAt !== null && card.dueAt <= now,
    ).length,
    streak: calculateStreak(
      data.events.map((event) => event.day),
      today,
    ),
    reviewSessions: data.sessions.filter(
      (session) =>
        session.kind === "review" &&
        session.completedAt !== null &&
        session.cursor > 0,
    ).length,
    activity: Array.from({ length: 7 }, (_, i) => {
      const day = dayOffset(today, i - 6);
      return {
        day,
        count: data.events.filter((event) => event.day === day).length,
      };
    }),
    worlds: ["work", "everyday", "automotive"].map((world) => {
      const ids = new Set(
        expressions
          .filter((item) => item.category === world)
          .map((item) => item.id),
      );
      return {
        world,
        total: ids.size,
        learned: data.cards.filter(
          (card) => ids.has(card.expressionId) && card.learnedAt !== null,
        ).length,
      };
    }),
  };
}
