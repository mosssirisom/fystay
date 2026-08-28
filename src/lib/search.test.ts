import { describe, expect, it } from "vitest";
import { isPetFriendly, parseGuestParam, summarizeGuests, totalOccupants } from "./search";

describe("totalOccupants", () => {
  it("sums adults and children, ignoring infants", () => {
    expect(totalOccupants({ adults: 2, children: 1 })).toBe(3);
  });

  it("handles zero children", () => {
    expect(totalOccupants({ adults: 1, children: 0 })).toBe(1);
  });
});

describe("isPetFriendly", () => {
  it("matches an amenity containing 'pet', case-insensitively", () => {
    expect(isPetFriendly(["Wifi", "Pet friendly", "Kitchen"])).toBe(true);
    expect(isPetFriendly(["Wifi", "PETS WELCOME"])).toBe(true);
  });

  it("returns false when no amenity mentions pets", () => {
    expect(isPetFriendly(["Wifi", "Kitchen", "Free parking"])).toBe(false);
  });

  it("returns false for an empty amenities list", () => {
    expect(isPetFriendly([])).toBe(false);
  });
});

describe("summarizeGuests", () => {
  it("returns a placeholder when nothing is selected", () => {
    expect(summarizeGuests({ adults: 0, children: 0, infants: 0, pets: 0 })).toBe("Add guests");
  });

  it("pluralizes correctly for a single guest", () => {
    expect(summarizeGuests({ adults: 1, children: 0, infants: 0, pets: 0 })).toBe("1 guest");
  });

  it("combines guests, infants, and pets into one summary", () => {
    expect(summarizeGuests({ adults: 2, children: 1, infants: 1, pets: 2 })).toBe(
      "3 guests, 1 infant, 2 pets",
    );
  });
});

describe("parseGuestParam", () => {
  it("parses a valid numeric string", () => {
    expect(parseGuestParam("3", 1)).toBe(3);
  });

  it("falls back for missing, negative, or non-numeric values", () => {
    expect(parseGuestParam(undefined, 1)).toBe(1);
    expect(parseGuestParam("-1", 0)).toBe(0);
    expect(parseGuestParam("not-a-number", 2)).toBe(2);
    expect(parseGuestParam(["1", "2"], 5)).toBe(5);
  });
});
