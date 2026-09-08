import type { WeatherCondition } from "@/lib/localData/weatherCodes";

/**
 * One honest, short line translating today's actual weather into a plan -
 * the "recommended activities based on weather" the brief asks for. Never
 * names a specific place (that's what the ranked recommendation list right
 * below it is for) - just the general shape of a good day given what the
 * sky is actually doing, so it reads as advice rather than a hedge.
 */
export function describeWeatherPlan(condition: WeatherCondition, temperatureC: number): string {
  if (condition.rainy) {
    return "Rain about - a good day for something indoors: museums, cafés, shops and rainy-day picks below.";
  }
  if (temperatureC >= 18) {
    return "Warm and dry - a great day for the beach, a coastal walk, or eating outside.";
  }
  if (temperatureC >= 11) {
    return "Dry and mild - good for a walk along the front or exploring on foot.";
  }
  return "Cold but dry - wrap up for a walk, or duck into somewhere warm nearby.";
}
