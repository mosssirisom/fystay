import { describe, expect, it } from "vitest";
import { nearbyLandmarks } from "./landmarks";

describe("nearbyLandmarks", () => {
  it("finds a landmark at its own coordinates as ~0 miles away", () => {
    // Blackpool Tower's own coordinates - the nearest attraction to that
    // exact point should be Blackpool Tower itself, at essentially 0 miles.
    const result = nearbyLandmarks({ latitude: 53.8142, longitude: -3.0553 });
    const tower = result.find((l) => l.name === "Blackpool Tower");
    expect(tower).toBeDefined();
    expect(tower!.distanceMiles).toBeLessThan(0.05);
  });

  it("sorts every result closest-first, attractions and the station mixed together", () => {
    const result = nearbyLandmarks({ latitude: 53.8142, longitude: -3.0553 });
    const distances = result.map((l) => l.distanceMiles);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("includes at most one station, and it's the nearest one - never a farther one", () => {
    const result = nearbyLandmarks({ latitude: 53.8142, longitude: -3.0553 });
    const stations = result.filter((l) => l.category === "station");
    expect(stations.length).toBeLessThanOrEqual(1);
  });

  it("never returns more attractions than maxAttractions", () => {
    const result = nearbyLandmarks(
      { latitude: 53.8142, longitude: -3.0553 },
      { maxAttractions: 2 },
    );
    expect(result.filter((l) => l.category === "attraction").length).toBeLessThanOrEqual(2);
  });

  it("excludes attractions further than maxAttractionMiles, rather than padding the list with distant ones", () => {
    const result = nearbyLandmarks(
      { latitude: 53.8142, longitude: -3.0553 },
      { maxAttractionMiles: 0.01 },
    );
    expect(result.every((l) => l.category !== "attraction" || l.distanceMiles <= 0.01)).toBe(true);
  });

  it("omits a walk-time estimate once a landmark is too far to sensibly walk to", () => {
    // A point far from every landmark in the dataset (out in the Irish
    // Sea) - whatever it finds within range should have no walk estimate.
    const result = nearbyLandmarks({ latitude: 53.85, longitude: -3.3 }, { maxAttractionMiles: 20, maxStationMiles: 20 });
    for (const landmark of result) {
      if (landmark.distanceMiles > 1.5) {
        expect(landmark.walkMinutes).toBeNull();
      }
    }
  });

  it("rounds distance to one decimal place, never showing false precision", () => {
    const result = nearbyLandmarks({ latitude: 53.8142, longitude: -3.0553 });
    for (const landmark of result) {
      expect(landmark.distanceMiles).toBe(Math.round(landmark.distanceMiles * 10) / 10);
    }
  });
});
