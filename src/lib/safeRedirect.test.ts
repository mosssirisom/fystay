import { describe, expect, it } from "vitest";
import { safeRedirectPath, sanitizeCallbackUrl } from "./safeRedirect";

describe("sanitizeCallbackUrl", () => {
  it("returns null for a missing value", () => {
    expect(sanitizeCallbackUrl(null)).toBeNull();
    expect(sanitizeCallbackUrl(undefined)).toBeNull();
    expect(sanitizeCallbackUrl("")).toBeNull();
  });

  it("allows a plain relative path", () => {
    expect(sanitizeCallbackUrl("/host/dashboard")).toBe("/host/dashboard");
    expect(sanitizeCallbackUrl("/listings/123?foo=bar")).toBe("/listings/123?foo=bar");
  });

  it("rejects a javascript: URL disguised as a path", () => {
    expect(sanitizeCallbackUrl("javascript:alert(document.cookie)")).toBeNull();
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeCallbackUrl("//evil.com")).toBeNull();
    expect(sanitizeCallbackUrl("/\\evil.com")).toBeNull();
  });

  it("rejects an absolute external URL", () => {
    expect(sanitizeCallbackUrl("https://evil.com")).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  it("falls back to / by default", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("falls back to a custom default", () => {
    expect(safeRedirectPath("//evil.com", "/host/dashboard")).toBe("/host/dashboard");
  });

  it("passes through a safe relative path", () => {
    expect(safeRedirectPath("/bookings/1")).toBe("/bookings/1");
  });
});
