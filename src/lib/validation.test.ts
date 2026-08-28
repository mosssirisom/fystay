import { describe, expect, it } from "vitest";
import { httpUrlSchema } from "./validation";

describe("httpUrlSchema", () => {
  it("accepts an https URL", () => {
    expect(httpUrlSchema.safeParse("https://example.com/photo.jpg").success).toBe(true);
  });

  it("accepts an http URL", () => {
    expect(httpUrlSchema.safeParse("http://example.com/photo.jpg").success).toBe(true);
  });

  it("rejects a javascript: URL", () => {
    expect(httpUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("rejects a data: URL", () => {
    expect(httpUrlSchema.safeParse("data:image/svg+xml,<svg></svg>").success).toBe(false);
  });

  it("rejects a plain non-URL string", () => {
    expect(httpUrlSchema.safeParse("not a url").success).toBe(false);
  });
});
