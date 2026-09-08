import { describe, expect, it } from "vitest";
import { MOOD_CATEGORY_PRIORITY, MOODS, orderCategoriesForMood, topPicksForMood } from "./moods";
import { GUIDE_CATEGORIES, LOCAL_GUIDES, type TownGuide } from "./localGuide";

const VALID_CATEGORY_KEYS = new Set(GUIDE_CATEGORIES.map((category) => category.key));

describe("MOOD_CATEGORY_PRIORITY", () => {
  it("has a priority list for every mood", () => {
    for (const mood of MOODS) {
      expect(MOOD_CATEGORY_PRIORITY[mood.key]).toBeDefined();
      expect(MOOD_CATEGORY_PRIORITY[mood.key].length).toBeGreaterThan(0);
    }
  });

  it("only references real guide category keys, with no typos", () => {
    for (const priority of Object.values(MOOD_CATEGORY_PRIORITY)) {
      for (const key of priority) {
        expect(VALID_CATEGORY_KEYS.has(key)).toBe(true);
      }
    }
  });

  it("never repeats a category within one mood's priority list", () => {
    for (const priority of Object.values(MOOD_CATEGORY_PRIORITY)) {
      expect(new Set(priority).size).toBe(priority.length);
    }
  });
});

describe("orderCategoriesForMood", () => {
  it("returns the original, unmodified order when no mood is picked", () => {
    expect(orderCategoriesForMood(null)).toEqual(GUIDE_CATEGORIES);
  });

  it("puts a mood's priority categories first, in priority order", () => {
    const ordered = orderCategoriesForMood("nightOut");
    const orderedKeys = ordered.map((c) => c.key);
    expect(orderedKeys.slice(0, 3)).toEqual(["pubsAndNightlife", "eat", "events"]);
  });

  it("never drops or duplicates a category - only ever reorders", () => {
    for (const mood of MOODS) {
      const ordered = orderCategoriesForMood(mood.key);
      expect(ordered).toHaveLength(GUIDE_CATEGORIES.length);
      expect(new Set(ordered.map((c) => c.key)).size).toBe(GUIDE_CATEGORIES.length);
    }
  });

  it("keeps every non-priority category in its original relative order", () => {
    const ordered = orderCategoriesForMood("foodAndDrink");
    const priority = new Set(MOOD_CATEGORY_PRIORITY.foodAndDrink);
    const remaining = ordered.filter((c) => !priority.has(c.key)).map((c) => c.key);
    const originalRemaining = GUIDE_CATEGORIES.filter((c) => !priority.has(c.key)).map((c) => c.key);
    expect(remaining).toEqual(originalRemaining);
  });
});

describe("topPicksForMood", () => {
  const guide = LOCAL_GUIDES.blackpool as TownGuide;

  it("returns at most three picks", () => {
    for (const mood of MOODS) {
      expect(topPicksForMood(guide, mood.key).length).toBeLessThanOrEqual(3);
    }
  });

  it("pulls the first entry from each priority category, in order", () => {
    const picks = topPicksForMood(guide, "nightOut");
    expect(picks[0]).toMatchObject({ category: "pubsAndNightlife", entry: guide.pubsAndNightlife[0] });
    expect(picks[1]).toMatchObject({ category: "eat", entry: guide.eat[0] });
    expect(picks[2]).toMatchObject({ category: "events", entry: guide.events[0] });
  });

  it("skips a priority category that has no entries for this town", () => {
    const sparseGuide: TownGuide = {
      ...guide,
      pubsAndNightlife: [],
    };
    const picks = topPicksForMood(sparseGuide, "nightOut");
    expect(picks.map((p) => p.category)).not.toContain("pubsAndNightlife");
  });
});
