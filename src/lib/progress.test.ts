import { expect, it } from "vitest";
import { calculateStreak, progressMetrics } from "./progress";
import { freshCard, localDay, schedule } from "./scheduler";
it("counts distinct contiguous local activity days and allows an unfinished today", () => {
  expect(calculateStreak([], "2026-10-30")).toBe(0);
  expect(
    calculateStreak(
      ["2026-10-30", "2026-10-30", "2026-10-29", "2026-10-28"],
      "2026-10-30",
    ),
  ).toBe(3);
  expect(calculateStreak(["2026-10-29", "2026-10-28"], "2026-10-30")).toBe(2);
  expect(calculateStreak(["2026-10-28"], "2026-10-30")).toBe(0);
  expect(calculateStreak(["2026-10-31", "2026-10-29"], "2026-10-30")).toBe(1);
});
it("derives dashboard metrics from stored activity rather than defaults", () => {
  const now = new Date(2026, 9, 30, 12).getTime();
  const day = localDay(now);
  const card = schedule(freshCard("work-001"), "good", now - 86400000);
  const result = progressMetrics(
    {
      cards: [card],
      sessions: [],
      preferences: [],
      events: [
        {
          id: "event",
          expressionId: card.expressionId,
          at: now,
          day,
          rating: "good",
          sessionId: null,
        },
      ],
    },
    now,
  );
  expect(result.learned).toBe(1);
  expect(result.mastered).toBe(0);
  expect(result.dueNow).toBe(1);
  expect(result.streak).toBe(1);
  expect(result.reviewSessions).toBe(0);
  expect(result.activity.at(-1)?.count).toBe(1);
  expect(result.worlds[0].learned).toBe(1);
});
