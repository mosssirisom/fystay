import { describe, expect, it } from "vitest";
import { isSuspended } from "./suspension";

describe("isSuspended", () => {
  it("is false when suspendedAt is null", () => {
    expect(isSuspended({ suspendedAt: null })).toBe(false);
  });

  it("is true when suspendedAt is set", () => {
    expect(isSuspended({ suspendedAt: new Date("2026-01-01") })).toBe(true);
  });
});
