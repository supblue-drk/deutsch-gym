import { expect, it } from "vitest";
import { expressions, searchExpressions, worlds } from "./content";
it("bundles 60 unique, complete B2–C1 expressions with stable explicit IDs", () => {
  expect(expressions).toHaveLength(60);
  expect(new Set(expressions.map((item) => item.id)).size).toBe(60);
  for (const item of expressions) {
    expect(item.id).toMatch(/^(work|life|auto)-\d{3}$/);
    expect(Object.keys(worlds)).toContain(item.category);
    expect(["B2", "C1"]).toContain(item.level);
    expect(["formal", "neutral", "informal"]).toContain(item.register);
    for (const key of [
      "german",
      "chinese",
      "explanation",
      "example",
      "exampleChinese",
      "notes",
    ] as const)
      expect(item[key].trim().length).toBeGreaterThan(1);
    expect(item.chinese).toMatch(/[\u4e00-\u9fff]/);
    expect(item.exampleChinese).toMatch(/[\u4e00-\u9fff]/);
    expect(item.tags.length).toBeGreaterThan(0);
  }
  for (const category of Object.keys(worlds))
    expect(
      expressions.filter((item) => item.category === category),
    ).toHaveLength(20);
});
it("searches German, Chinese, notes and tags with category/level intersections", () => {
  expect(
    searchExpressions("ZAHLUNGSBEREITSCHAFT", "automotive", "C1").map(
      (item) => item.id,
    ),
  ).toEqual(["auto-010"]);
  expect(searchExpressions("通勤").map((item) => item.id)).toContain(
    "life-014",
  );
  expect(searchExpressions("Dativ", "work", "C1").length).toBeGreaterThan(0);
  expect(
    searchExpressions("  ", "everyday", "B2").every(
      (item) => item.category === "everyday" && item.level === "B2",
    ),
  ).toBe(true);
  expect(searchExpressions("不存在的词")).toEqual([]);
});
