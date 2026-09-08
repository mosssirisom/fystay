import { describe, expect, it } from "vitest";
import { describeWeatherPlan } from "./weatherPlan";
import type { WeatherCondition } from "./weatherCodes";

const dry: WeatherCondition = { label: "Clear sky", icon: "sun", rainy: false };
const wet: WeatherCondition = { label: "Rain", icon: "rain", rainy: true };

describe("describeWeatherPlan", () => {
  it("suggests indoor plans when it's rainy, regardless of temperature", () => {
    expect(describeWeatherPlan(wet, 22)).toMatch(/indoor/);
  });

  it("suggests the beach on a warm, dry day", () => {
    expect(describeWeatherPlan(dry, 20)).toMatch(/beach/);
  });

  it("suggests a walk on a mild, dry day", () => {
    expect(describeWeatherPlan(dry, 14)).toMatch(/walk/);
  });

  it("suggests wrapping up on a cold, dry day", () => {
    expect(describeWeatherPlan(dry, 4)).toMatch(/Cold/);
  });
});
