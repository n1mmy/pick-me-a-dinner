import { describe, it, expect, vi } from "vitest";
import { buildEntityTags, computeLastUsed, tagAwareScore, pickTop, pickBest } from "@/lib/scoring";

describe("buildEntityTags", () => {
  it("maps restaurant and meal ids to their tags", () => {
    const restaurants = [{ id: "r1", tags: ["italian", "pizza"] }];
    const meals = [{ id: "m1", tags: ["quick"] }];
    const map = buildEntityTags(restaurants, meals);
    expect(map.get("r1")).toEqual(["italian", "pizza"]);
    expect(map.get("m1")).toEqual(["quick"]);
  });

  it("returns empty map for empty inputs", () => {
    expect(buildEntityTags([], []).size).toBe(0);
  });

  it("handles entities with no tags", () => {
    const map = buildEntityTags([{ id: "r1", tags: [] }], []);
    expect(map.get("r1")).toEqual([]);
  });
});

// Fixed "now" so day calculations are deterministic
const NOW = new Date("2026-03-20T12:00:00Z").getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000);

describe("computeLastUsed", () => {
  it("records days since last use for each entity", () => {
    const dinners = [
      { date: daysAgo(3), restaurantId: "r1", mealId: null },
      { date: daysAgo(10), restaurantId: "r1", mealId: null }, // older, should be ignored
      { date: daysAgo(5), restaurantId: null, mealId: "m1" },
    ];
    const { lastUsed } = computeLastUsed(dinners, new Map(), NOW);
    expect(lastUsed.get("r1")).toBe(3);
    expect(lastUsed.get("m1")).toBe(5);
  });

  it("tracks tag recency across dinners", () => {
    const entityTags = new Map([["r1", ["italian", "pizza"]]]);
    const dinners = [{ date: daysAgo(4), restaurantId: "r1", mealId: null }];
    const { tagLastUsed } = computeLastUsed(dinners, entityTags, NOW);
    expect(tagLastUsed.get("italian")).toBe(4);
    expect(tagLastUsed.get("pizza")).toBe(4);
  });

  it("keeps the minimum (most recent) days for repeated entity use", () => {
    const dinners = [
      { date: daysAgo(10), restaurantId: "r1", mealId: null },
      { date: daysAgo(2), restaurantId: "r1", mealId: null },
    ];
    const { lastUsed } = computeLastUsed(dinners, new Map(), NOW);
    expect(lastUsed.get("r1")).toBe(2);
  });

  it("returns empty maps for no dinners", () => {
    const { lastUsed, tagLastUsed } = computeLastUsed([], new Map(), NOW);
    expect(lastUsed.size).toBe(0);
    expect(tagLastUsed.size).toBe(0);
  });
});

describe("tagAwareScore", () => {
  it("uses entity days when no tags", () => {
    const lastUsed = new Map([["r1", 5]]);
    const score = tagAwareScore("r1", [], lastUsed, new Map());
    // base is min(5, 5, 21) = 5, plus jitter [0,3)
    expect(score).toBeGreaterThanOrEqual(5);
    expect(score).toBeLessThan(8);
  });

  it("caps score at 21 even if entity was never used", () => {
    const score = tagAwareScore("r1", [], new Map(), new Map());
    expect(score).toBeGreaterThanOrEqual(21);
    expect(score).toBeLessThan(24);
  });

  it("is limited by tag recency when tag was used more recently than entity", () => {
    const lastUsed = new Map([["r1", 20]]);
    const tagLastUsed = new Map([["italian", 2]]);
    const score = tagAwareScore("r1", ["italian"], lastUsed, tagLastUsed);
    // tag brings it down to min(20, 2, 21) = 2
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThan(5);
  });

  it("is not raised above entity days by an unused tag", () => {
    const lastUsed = new Map([["r1", 3]]);
    const score = tagAwareScore("r1", ["rare-tag"], lastUsed, new Map());
    // entityDays=3, tagMinDays=Infinity → min(3, Inf, 21)=3
    expect(score).toBeGreaterThanOrEqual(3);
    expect(score).toBeLessThan(6);
  });
});

describe("pickTop", () => {
  const opt = (id: string, score: number, tags: string[] = []) => ({
    id,
    score,
    tagsWithRecency: tags.map((tag) => ({ tag })),
  });

  it("returns up to n items sorted by score descending", () => {
    const options = [opt("a", 5), opt("b", 10), opt("c", 8)];
    const result = pickTop(options, 2);
    expect(result.map((o) => o.id)).toEqual(["b", "c"]);
  });

  it("skips an option if any of its tags already has 2 entries", () => {
    const options = [
      opt("a", 10, ["italian"]),
      opt("b", 9, ["italian"]),
      opt("c", 8, ["italian"]), // should be skipped: italian already at count 2
      opt("d", 7, []),
    ];
    const result = pickTop(options, 10);
    expect(result.map((o) => o.id)).toEqual(["a", "b", "d"]);
  });

  it("does not limit tagless options", () => {
    const options = [opt("a", 5), opt("b", 4), opt("c", 3), opt("d", 2)];
    const result = pickTop(options, 3);
    expect(result).toHaveLength(3);
  });

  it("returns empty array when given empty options", () => {
    expect(pickTop([], 5)).toEqual([]);
  });
});

describe("pickBest", () => {
  it("returns the highest-scoring option", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const options = [
      { id: "a", score: 10 },
      { id: "b", score: 21 },
      { id: "c", score: 15 },
    ];
    expect(pickBest(options)?.id).toBe("b");
    vi.restoreAllMocks();
  });

  it("picks randomly among tied options", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const options = [
      { id: "a", score: 21 },
      { id: "b", score: 21 },
    ];
    expect(pickBest(options)?.id).toBe("b");
    vi.restoreAllMocks();
  });

  it("returns null for empty array", () => {
    expect(pickBest([])).toBeNull();
  });
});
