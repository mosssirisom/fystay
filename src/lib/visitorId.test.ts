import { describe, expect, it } from "vitest";
import { readVisitorId } from "./visitorId";

describe("readVisitorId", () => {
  it("returns null when there is no cookie header at all", () => {
    expect(readVisitorId(null)).toBeNull();
    expect(readVisitorId(undefined)).toBeNull();
    expect(readVisitorId("")).toBeNull();
  });

  it("returns null when the header doesn't contain the visitor cookie", () => {
    expect(readVisitorId("other=1; another=2")).toBeNull();
  });

  it("reads the value when it's the only cookie", () => {
    expect(readVisitorId("fystay_vid=abc-123")).toBe("abc-123");
  });

  it("reads the value among other cookies, in any position", () => {
    expect(readVisitorId("a=1; fystay_vid=abc-123; b=2")).toBe("abc-123");
    expect(readVisitorId("fystay_vid=abc-123; a=1")).toBe("abc-123");
    expect(readVisitorId("a=1; fystay_vid=abc-123")).toBe("abc-123");
  });

  it("treats an empty cookie value as absent", () => {
    expect(readVisitorId("fystay_vid=; a=1")).toBeNull();
  });

  it("doesn't match a cookie name that merely contains the visitor cookie's name as a substring", () => {
    expect(readVisitorId("not_fystay_vid=abc-123")).toBeNull();
    expect(readVisitorId("fystay_vid_extra=abc-123")).toBeNull();
  });
});
