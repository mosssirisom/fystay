import { describe, expect, it } from "vitest";
import { describeWhyRecommended } from "./whyRecommended";

describe("describeWhyRecommended", () => {
  it("uses the editorial tag's own reason when one is set", () => {
    expect(describeWhyRecommended({ editorialTag: "HIDDEN_GEM", distanceMiles: null, rating: null })).toMatch(/locals/);
  });

  it("falls back to a real rating signal when there's no editorial tag", () => {
    expect(describeWhyRecommended({ editorialTag: null, distanceMiles: null, rating: 4.5 })).toMatch(/well-rated/);
  });

  it("falls back to a real distance signal when there's no tag or rating", () => {
    expect(describeWhyRecommended({ editorialTag: null, distanceMiles: 0.2, rating: null })).toMatch(/doorstep/);
  });

  it("never fabricates a reason when nothing is actually known", () => {
    expect(describeWhyRecommended({ editorialTag: null, distanceMiles: null, rating: null })).toMatch(/local spot/);
  });
});
