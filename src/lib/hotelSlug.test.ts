import { describe, expect, it } from "vitest";
import { buildHotelSlugBase, ensureUniqueSlug, slugify } from "./hotelSlug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("The Grand Hotel")).toBe("the-grand-hotel");
  });

  it("strips punctuation", () => {
    expect(slugify("O'Malley's & Sons!")).toBe("o-malley-s-sons");
  });

  it("trims leading/trailing hyphens left over from stripped punctuation", () => {
    expect(slugify("  --Blackpool--  ")).toBe("blackpool");
  });

  it("falls back to a placeholder for an all-punctuation input", () => {
    expect(slugify("!!!")).toBe("hotel");
  });

  it("falls back to a placeholder for an empty input", () => {
    expect(slugify("")).toBe("hotel");
  });
});

describe("buildHotelSlugBase", () => {
  it("combines name and city", () => {
    expect(buildHotelSlugBase("The Grand Hotel", "Blackpool")).toBe("the-grand-hotel-blackpool");
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the base unchanged when not taken", () => {
    expect(ensureUniqueSlug("the-grand-hotel-blackpool", () => false)).toBe(
      "the-grand-hotel-blackpool",
    );
  });

  it("appends -2 when the base is taken but -2 is free", () => {
    const taken = new Set(["the-grand-hotel-blackpool"]);
    expect(ensureUniqueSlug("the-grand-hotel-blackpool", (c) => taken.has(c))).toBe(
      "the-grand-hotel-blackpool-2",
    );
  });

  it("keeps incrementing past multiple collisions", () => {
    const taken = new Set([
      "the-grand-hotel-blackpool",
      "the-grand-hotel-blackpool-2",
      "the-grand-hotel-blackpool-3",
    ]);
    expect(ensureUniqueSlug("the-grand-hotel-blackpool", (c) => taken.has(c))).toBe(
      "the-grand-hotel-blackpool-4",
    );
  });
});
