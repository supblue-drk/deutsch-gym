export type Rating = "again" | "hard" | "good" | "easy";
export type CardState = "new" | "learning" | "review" | "mastered";
export interface CardProgress {
  expressionId: string;
  favorite: boolean;
  state: CardState;
  learnedAt: number | null;
  lastReviewedAt: number | null;
  lastReviewedDate: string | null;
  nextReviewDate: string | null;
  dueAt: number | null;
  reviewCount: number;
  lapseCount: number;
  interval: number;
  ease: number;
}
export interface LearningSession {
  id: string;
  kind: "daily" | "review";
  day: string;
  queue: string[];
  newIds: string[];
  cursor: number;
  startedAt: number;
  completedAt: number | null;
}
export interface LearningEvent {
  id: string;
  expressionId: string;
  at: number;
  day: string;
  rating: Rating | null;
  sessionId: string | null;
}
