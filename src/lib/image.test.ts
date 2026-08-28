import { describe, expect, it } from "vitest";
import { isOptimizableImage } from "./image";

describe("isOptimizableImage", () => {
  it("allows the known Unsplash host", () => {
    expect(isOptimizableImage("https://images.unsplash.com/photo-123")).toBe(true);
  });

  it("rejects an arbitrary unknown host", () => {
    expect(isOptimizableImage("https://evil.example.com/photo.jpg")).toBe(false);
  });

  it("rejects a malformed URL instead of throwing", () => {
    expect(isOptimizableImage("not a url")).toBe(false);
  });

  it("rejects a data: URI (used for seed placeholder art)", () => {
    expect(isOptimizableImage("data:image/svg+xml,<svg></svg>")).toBe(false);
  });
});
