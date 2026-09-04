import { describe, expect, it } from "vitest";
import { fyldeCoastCenter, geocodeListing } from "./geocoding";

describe("geocodeListing", () => {
  it("returns coordinates near Blackpool's town center for a Blackpool listing", () => {
    const result = geocodeListing({ id: "listing-1", city: "Blackpool" });
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(53.8175, 1);
    expect(result!.longitude).toBeCloseTo(-3.0357, 1);
  });

  it("matches city names case-insensitively and ignores surrounding whitespace", () => {
    const exact = geocodeListing({ id: "listing-1", city: "Fleetwood" });
    const messy = geocodeListing({ id: "listing-1", city: "  FLEETWOOD  " });
    expect(messy).toEqual(exact);
  });

  it("returns null for a city outside FYStay's coverage rather than guessing", () => {
    expect(geocodeListing({ id: "listing-1", city: "Manchester" })).toBeNull();
  });

  it("is deterministic - the same id and city always jitters to the same point", () => {
    const first = geocodeListing({ id: "listing-42", city: "Cleveleys" });
    const second = geocodeListing({ id: "listing-42", city: "Cleveleys" });
    expect(first).toEqual(second);
  });

  it("jitters different listings in the same town to different points", () => {
    const a = geocodeListing({ id: "listing-a", city: "Bispham" });
    const b = geocodeListing({ id: "listing-b", city: "Bispham" });
    expect(a).not.toEqual(b);
  });
});

describe("fyldeCoastCenter", () => {
  it("returns a point roughly in the middle of FYStay's coverage area", () => {
    const center = fyldeCoastCenter();
    // All five towns sit within this rough box - a loose bound, just to
    // catch a badly broken average rather than pin an exact value.
    expect(center.latitude).toBeGreaterThan(53.7);
    expect(center.latitude).toBeLessThan(53.95);
    expect(center.longitude).toBeGreaterThan(-3.1);
    expect(center.longitude).toBeLessThan(-2.9);
  });
});
