import { describe, expect, it } from "vitest";
import { describeWeatherCode } from "./weatherCodes";

describe("describeWeatherCode", () => {
  it("marks clear and overcast codes as not rainy", () => {
    expect(describeWeatherCode(0).rainy).toBe(false);
    expect(describeWeatherCode(1).rainy).toBe(false);
    expect(describeWeatherCode(3).rainy).toBe(false);
  });

  it("marks every rain/drizzle/shower/storm code as rainy", () => {
    for (const code of [51, 61, 63, 80, 82, 95, 99]) {
      expect(describeWeatherCode(code).rainy).toBe(true);
    }
  });

  it("marks snow as rainy (an indoor-activity signal, not literally wet)", () => {
    expect(describeWeatherCode(71).rainy).toBe(true);
    expect(describeWeatherCode(85).rainy).toBe(true);
  });

  it("falls back to a sensible unknown-code default rather than throwing", () => {
    const result = describeWeatherCode(9999);
    expect(result.label).toBeTruthy();
    expect(result.rainy).toBe(false);
  });
});
