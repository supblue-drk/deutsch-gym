import { describe, expect, it } from "vitest";
import {
  dayOffset,
  dayStart,
  freshCard,
  localDay,
  schedule,
} from "./scheduler";
const now = new Date(2026, 9, 30, 23, 58).getTime();
describe("deterministic recall scheduling", () => {
  it.each([
    ["again", 0, "learning"],
    ["hard", 1, "learning"],
    ["good", 1, "review"],
    ["easy", 4, "review"],
  ] as const)("schedules %s", (rating, interval, state) => {
    const original = freshCard("work-001");
    const next = schedule(original, rating, now);
    expect(next).toEqual(schedule(original, rating, now));
    expect(original.reviewCount).toBe(0);
    expect(next.interval).toBe(interval);
    expect(next.state).toBe(state);
    expect(next.reviewCount).toBe(1);
    expect(next.lapseCount).toBe(rating === "again" ? 1 : 0);
    expect(next.dueAt).toBe(
      rating === "again"
        ? now + 600000
        : dayStart(dayOffset(localDay(now), interval)),
    );
    expect(next.lastReviewedDate).toBe("2026-10-30");
  });
  it("grows Good intervals, graduates to mastered, and relearns after a lapse", () => {
    let card = freshCard("work-001");
    const intervals = [1, 3, 8, 20, 50];
    for (const interval of intervals) {
      card = schedule(card, "good", now);
      expect(card.interval).toBe(interval);
    }
    expect(card.state).toBe("mastered");
    const again = schedule(card, "again", now);
    expect(again.state).toBe("learning");
    expect(again.learnedAt).toBe(card.learnedAt);
    expect(again.lapseCount).toBe(1);
    expect(schedule(again, "good", now).interval).toBe(1);
    expect(schedule(card, "hard", now).interval).toBeLessThan(
      schedule(card, "good", now).interval,
    );
    expect(schedule(card, "easy", now).interval).toBeGreaterThan(
      schedule(card, "good", now).interval,
    );
  });
  it("handles midnight, leap years and local calendar day offsets", () => {
    expect(localDay(schedule(freshCard("work-001"), "again", now).dueAt!)).toBe(
      "2026-10-31",
    );
    expect(dayOffset("2024-02-28", 1)).toBe("2024-02-29");
    expect(dayOffset("2026-12-31", 1)).toBe("2027-01-01");
    expect(localDay(dayStart("2026-03-30"))).toBe("2026-03-30");
  });
});

it("uses local midnight across the German daylight-saving transition", () => {
  const before = new Date(2026, 2, 29, 0, 30).getTime();
  const result = schedule(freshCard("work-001"), "good", before);
  expect(result.nextReviewDate).toBe("2026-03-30");
  expect(new Date(result.dueAt!).getHours()).toBe(0);
  if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Berlin") {
    expect(dayStart("2026-03-30") - dayStart("2026-03-29")).toBe(23 * 3600000);
  }
});
