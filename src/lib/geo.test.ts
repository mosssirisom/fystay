import { describe, expect, it } from "vitest";
import { distanceMiles, estimateDriveMinutes, estimateWalkMinutes } from "./geo";

describe("distanceMiles", () => {
  it("is zero for the same point", () => {
    const point = { latitude: 53.8142, longitude: -3.0553 };
    expect(distanceMiles(point, point)).toBeCloseTo(0, 5);
  });

  it("is symmetric", () => {
    const a = { latitude: 53.8142, longitude: -3.0553 };
    const b = { latitude: 53.9268, longitude: -3.0068 };
    expect(distanceMiles(a, b)).toBeCloseTo(distanceMiles(b, a), 10);
  });

  it("matches a known real-world distance within a reasonable margin", () => {
    // Blackpool Tower to Fleetwood Ferry - roughly 8 miles as the crow flies.
    const tower = { latitude: 53.8142, longitude: -3.0553 };
    const ferry = { latitude: 53.9268, longitude: -3.0068 };
    expect(distanceMiles(tower, ferry)).toBeGreaterThan(6);
    expect(distanceMiles(tower, ferry)).toBeLessThan(10);
  });
});

describe("estimateWalkMinutes", () => {
  it("returns null for a distance of essentially zero", () => {
    expect(estimateWalkMinutes(0)).toBeNull();
  });

  it("returns a positive, rounded-to-5 estimate for a short distance", () => {
    const minutes = estimateWalkMinutes(0.5);
    expect(minutes).not.toBeNull();
    expect(minutes! % 5).toBe(0);
    expect(minutes).toBeGreaterThan(0);
  });

  it("returns null once too far to sensibly walk", () => {
    expect(estimateWalkMinutes(10)).toBeNull();
  });
});

describe("estimateDriveMinutes", () => {
  it("returns null for a distance of essentially zero", () => {
    expect(estimateDriveMinutes(0)).toBeNull();
  });

  it("is faster than the walking estimate for the same distance", () => {
    const walk = estimateWalkMinutes(1)!;
    const drive = estimateDriveMinutes(1)!;
    expect(walk).not.toBeNull();
    expect(drive).not.toBeNull();
    expect(drive).toBeLessThan(walk);
  });

  it("returns null once too far for this coast's own guide to realistically call it nearby", () => {
    expect(estimateDriveMinutes(50)).toBeNull();
  });
});
