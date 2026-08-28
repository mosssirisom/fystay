import { describe, expect, it } from "vitest";
import { isValidBlockRange } from "./availabilityBlocks";

const d = (s: string) => new Date(s);

describe("isValidBlockRange", () => {
  it("accepts an end date after the start date", () => {
    expect(isValidBlockRange(d("2026-06-01"), d("2026-06-05"))).toBe(true);
  });

  it("rejects an end date equal to the start date", () => {
    expect(isValidBlockRange(d("2026-06-01"), d("2026-06-01"))).toBe(false);
  });

  it("rejects an inverted range", () => {
    expect(isValidBlockRange(d("2026-06-05"), d("2026-06-01"))).toBe(false);
  });
});
