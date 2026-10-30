import data from "../data/expressions.json";
export type World = "work" | "everyday" | "automotive";
export interface Expression {
  id: string;
  category: World;
  german: string;
  chinese: string;
  explanation: string;
  example: string;
  exampleChinese: string;
  level: "B2" | "C1";
  register: "formal" | "neutral" | "informal";
  notes: string;
  tags: string[];
}
export const expressions = data as Expression[];
export const expressionById = new Map(
  expressions.map((item) => [item.id, item]),
);
export const worlds: Record<World, string> = {
  work: "Souverän im Beruf",
  everyday: "Natürlich im Alltag",
  automotive: "Automotive & Strategy",
};
export const registers = {
  formal: "Formell",
  neutral: "Neutral",
  informal: "Informell",
};
export function searchExpressions(
  query: string,
  category = "all",
  level = "all",
) {
  const terms = query
    .toLocaleLowerCase("de")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return expressions.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      (level === "all" || item.level === level) &&
      terms.every((term) =>
        [
          item.german,
          item.chinese,
          item.explanation,
          item.example,
          item.exampleChinese,
          item.notes,
          ...item.tags,
        ]
          .join(" ")
          .toLocaleLowerCase("de")
          .includes(term),
      ),
  );
}
