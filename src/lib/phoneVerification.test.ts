import { describe, expect, it } from "vitest";
import { isValidE164Phone } from "./phoneVerification";

describe("isValidE164Phone", () => {
  it("accepts a plausible UK mobile number in E.164 form", () => {
    expect(isValidE164Phone("+447911123456")).toBe(true);
  });

  it("accepts a plausible US number in E.164 form", () => {
    expect(isValidE164Phone("+14155552671")).toBe(true);
  });

  it("rejects a number missing the leading +", () => {
    expect(isValidE164Phone("447911123456")).toBe(false);
  });

  it("rejects a number starting with 0 after the +", () => {
    expect(isValidE164Phone("+0447911123456")).toBe(false);
  });

  it("rejects a number that's too short", () => {
    expect(isValidE164Phone("+4479")).toBe(false);
  });

  it("rejects a number with letters or spaces", () => {
    expect(isValidE164Phone("+44 7911 123456")).toBe(false);
    expect(isValidE164Phone("+44791112345a")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidE164Phone("")).toBe(false);
  });
});
