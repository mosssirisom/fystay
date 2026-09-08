import { describe, expect, it } from "vitest";
import { buildRecommendations, scoreRecommendation, type LocalRecommendation, type ScoringContext } from "./recommendationEngine";
import type { EditorialRecommendation, LocalPlace } from "@prisma/client";

const NOW = new Date("2026-09-09T12:00:00");
const ORIGIN = { latitude: 53.8142, longitude: -3.0553 };

function context(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return { origin: ORIGIN, weather: null, mood: null, now: NOW, ...overrides };
}

function baseRec(overrides: Partial<Omit<LocalRecommendation, "score">> = {}): Omit<LocalRecommendation, "score"> {
  return {
    id: "1",
    source: "OSM",
    name: "Test Place",
    category: "RESTAURANT",
    description: null,
    latitude: null,
    longitude: null,
    distanceMiles: null,
    walkMinutes: null,
    driveMinutes: null,
    rating: null,
    priceLevel: null,
    openingHours: null,
    openNow: null,
    website: null,
    imageUrl: null,
    familyFriendly: null,
    dogFriendly: null,
    accessibility: null,
    editorialTag: null,
    fyStayPick: false,
    ...overrides,
  };
}

function place(overrides: Partial<LocalPlace> = {}): LocalPlace {
  return {
    id: "place-1",
    source: "OSM",
    sourceId: "node/1",
    townSlug: "blackpool",
    name: "Test Place",
    category: "RESTAURANT",
    description: null,
    latitude: 53.8142,
    longitude: -3.0553,
    address: null,
    openingHours: null,
    website: null,
    phone: null,
    rating: null,
    priceLevel: null,
    imageUrl: null,
    familyFriendly: null,
    dogFriendly: null,
    accessibility: null,
    rawData: null,
    lastFetchedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as LocalPlace;
}

function editorial(overrides: Partial<EditorialRecommendation> = {}): EditorialRecommendation {
  return {
    id: "edit-1",
    slug: "blackpool-fystay-pick-test",
    townSlug: "blackpool",
    placeId: null,
    tag: "FYSTAY_PICK",
    name: "Editorial Place",
    category: "RESTAURANT",
    description: "A hand-written pick.",
    rank: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as EditorialRecommendation;
}

describe("scoreRecommendation", () => {
  it("scores a closer place higher than a farther one, all else equal", () => {
    const near = scoreRecommendation(baseRec({ distanceMiles: 0.2 }), context());
    const far = scoreRecommendation(baseRec({ distanceMiles: 4 }), context());
    expect(near).toBeGreaterThan(far);
  });

  it("gives an editorial pick a real, positive boost", () => {
    const plain = scoreRecommendation(baseRec(), context());
    const picked = scoreRecommendation(baseRec({ editorialTag: "FYSTAY_PICK" }), context());
    expect(picked).toBeGreaterThan(plain);
  });

  it("boosts indoor categories when it's rainy", () => {
    const rainyContext = context({ weather: { current: { condition: { rainy: true } } } as never });
    const cafe = scoreRecommendation(baseRec({ category: "CAFE" }), rainyContext);
    const cafeDry = scoreRecommendation(baseRec({ category: "CAFE" }), context());
    expect(cafe).toBeGreaterThan(cafeDry);
  });

  it("boosts outdoor categories when it's dry", () => {
    const beachDry = scoreRecommendation(baseRec({ category: "BEACH" }), context());
    const rainyContext = context({ weather: { current: { condition: { rainy: true } } } as never });
    const beachRainy = scoreRecommendation(baseRec({ category: "BEACH" }), rainyContext);
    expect(beachDry).toBeGreaterThan(beachRainy);
  });

  it("boosts a category relevant to the selected mood", () => {
    const pub = scoreRecommendation(baseRec({ category: "PUB" }), context({ mood: "nightOut" }));
    const pubNoMood = scoreRecommendation(baseRec({ category: "PUB" }), context());
    expect(pub).toBeGreaterThan(pubNoMood);
  });

  it("rewards being open now and penalizes being confirmed closed", () => {
    const open = scoreRecommendation(baseRec({ openNow: true }), context());
    const closed = scoreRecommendation(baseRec({ openNow: false }), context());
    const unknown = scoreRecommendation(baseRec({ openNow: null }), context());
    expect(open).toBeGreaterThan(unknown);
    expect(unknown).toBeGreaterThan(closed);
  });
});

describe("buildRecommendations", () => {
  it("includes both OSM places and editorial-only entries", () => {
    const result = buildRecommendations([place()], [editorial({ placeId: null })], context());
    expect(result).toHaveLength(2);
    expect(result.some((r) => r.source === "OSM")).toBe(true);
    expect(result.some((r) => r.source === "EDITORIAL")).toBe(true);
  });

  it("overlays an editorial tag onto its linked place instead of duplicating it", () => {
    const linkedPlace = place({ id: "place-2" });
    const linkedEditorial = editorial({ placeId: "place-2", tag: "HIDDEN_GEM" });
    const result = buildRecommendations([linkedPlace], [linkedEditorial], context());
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ source: "OSM", editorialTag: "HIDDEN_GEM", fyStayPick: true });
  });

  it("sorts the merged list highest score first", () => {
    const near = place({ id: "near", latitude: 53.8142, longitude: -3.0553 });
    const far = place({ id: "far", latitude: 53.95, longitude: -3.15 });
    const result = buildRecommendations([far, near], [], context());
    expect(result[0].id).toBe("near");
  });

  it("computes real distance/walk/drive for a place with an origin", () => {
    const nearby = place({ latitude: 53.815, longitude: -3.056 });
    const result = buildRecommendations([nearby], [], context());
    expect(result[0].distanceMiles).not.toBeNull();
    expect(result[0].distanceMiles).toBeLessThan(1);
  });

  it("leaves distance null with no origin, rather than defaulting to zero", () => {
    const result = buildRecommendations([place()], [], context({ origin: null }));
    expect(result[0].distanceMiles).toBeNull();
  });
});
