import type { CardProgress, Rating } from "./learning-types";
export function localDay(at = Date.now()) {
  const date = new Date(at);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dayOffset(day: string, offset: number) {
  const [year, month, date] = day.split("-").map(Number);
  return localDay(new Date(year, month - 1, date + offset, 12).getTime());
}
export function dayStart(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).getTime();
}
export function freshCard(expressionId: string): CardProgress {
  return {
    expressionId,
    favorite: false,
    state: "new",
    learnedAt: null,
    lastReviewedAt: null,
    lastReviewedDate: null,
    nextReviewDate: null,
    dueAt: null,
    reviewCount: 0,
    lapseCount: 0,
    interval: 0,
    ease: 2.5,
  };
}
export function schedule(
  previous: CardProgress,
  rating: Rating,
  now: number,
): CardProgress {
  let interval: number;
  let ease = previous.ease;
  if (rating === "again") {
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === "hard") {
    interval = Math.max(1, Math.ceil(previous.interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === "good")
    interval =
      previous.interval === 0
        ? 1
        : previous.interval === 1
          ? 3
          : Math.max(
              previous.interval + 1,
              Math.round(previous.interval * ease),
            );
  else {
    interval = Math.max(4, Math.round(previous.interval * ease * 1.5));
    ease = Math.min(3, ease + 0.15);
  }
  interval = Math.min(365, interval);
  const dueAt =
    rating === "again"
      ? now + 10 * 60_000
      : dayStart(dayOffset(localDay(now), interval));
  return {
    ...previous,
    state:
      rating === "again" || (rating === "hard" && previous.learnedAt === null)
        ? "learning"
        : interval >= 21
          ? "mastered"
          : "review",
    learnedAt:
      previous.learnedAt ??
      (rating === "good" || rating === "easy" ? now : null),
    lastReviewedAt: now,
    lastReviewedDate: localDay(now),
    nextReviewDate: localDay(dueAt),
    dueAt,
    reviewCount: previous.reviewCount + 1,
    lapseCount: previous.lapseCount + (rating === "again" ? 1 : 0),
    interval,
    ease: Math.round(ease * 100) / 100,
  };
}
