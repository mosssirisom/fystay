import { describe, expect, it } from "vitest";
import { paginate, parsePageParam } from "./pagination";

describe("parsePageParam", () => {
  it("falls back to page 1 for missing, non-numeric, zero, negative, or fractional values", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("not-a-number")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-3")).toBe(1);
    expect(parsePageParam("2.5")).toBe(1);
  });

  it("parses a valid positive integer", () => {
    expect(parsePageParam("3")).toBe(3);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it("returns the first page by default page size", () => {
    const result = paginate(items, 1, 10);
    expect(result).toEqual({ items: items.slice(0, 10), page: 1, totalPages: 3, totalCount: 25 });
  });

  it("returns a middle page", () => {
    const result = paginate(items, 2, 10);
    expect(result.items).toEqual(items.slice(10, 20));
    expect(result.page).toBe(2);
  });

  it("returns a partial final page", () => {
    const result = paginate(items, 3, 10);
    expect(result.items).toEqual(items.slice(20, 25));
    expect(result.totalPages).toBe(3);
  });

  it("clamps a page past the end to the last real page instead of returning empty", () => {
    const result = paginate(items, 99, 10);
    expect(result.page).toBe(3);
    expect(result.items).toEqual(items.slice(20, 25));
  });

  it("clamps page 0 or negative up to page 1", () => {
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, -5, 10).page).toBe(1);
  });

  it("reports exactly one page of everything when the list is empty", () => {
    const result = paginate([], 1, 10);
    expect(result).toEqual({ items: [], page: 1, totalPages: 1, totalCount: 0 });
  });
});
