import { describe, expect, it } from "vitest";
import { hasBedroomCountMismatch, mentionedBedroomCounts } from "./listingDataQuality";

describe("mentionedBedroomCounts", () => {
  it("finds a numeral count", () => {
    expect(mentionedBedroomCounts("A stylish 2-bedroom apartment")).toEqual([2]);
  });

  it("finds a spelled-out count", () => {
    expect(mentionedBedroomCounts("two comfortable bedrooms and a balcony")).toEqual([2]);
  });

  it("finds every distinct count mentioned", () => {
    const counts = mentionedBedroomCounts("A 2-bedroom apartment, though the third bed is a sofa bed");
    expect(counts).toContain(2);
  });

  it("returns an empty array when nothing is mentioned", () => {
    expect(mentionedBedroomCounts("A bright apartment near the seafront.")).toEqual([]);
  });
});

describe("hasBedroomCountMismatch", () => {
  it("flags a description that names a different count", () => {
    expect(
      hasBedroomCountMismatch(
        "Stylish 2-bedroom apartment with two comfortable bedrooms.",
        1,
      ),
    ).toBe(true);
  });

  it("does not flag a description that matches the real count", () => {
    expect(hasBedroomCountMismatch("Stylish 2-bedroom apartment.", 2)).toBe(false);
  });

  it("does not flag a description that never mentions a count at all", () => {
    expect(hasBedroomCountMismatch("A bright apartment near the seafront.", 1)).toBe(false);
  });
});
