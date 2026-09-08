export type WeatherCondition = {
  label: string;
  icon: "sun" | "cloud" | "rain" | "snow" | "storm" | "fog";
  /** True for anything that would send a guest looking for an indoor/rainy-day pick instead of a beach walk. */
  rainy: boolean;
};

/**
 * Open-Meteo (and the wider forecasting world) reports conditions as WMO
 * weather interpretation codes, not text - this is the one place that
 * turns a code into something a guest reads, so every screen that shows
 * weather agrees on what "63" means.
 */
export function describeWeatherCode(code: number): WeatherCondition {
  if (code === 0) return { label: "Clear sky", icon: "sun", rainy: false };
  if (code === 1 || code === 2) return { label: "Mostly clear", icon: "sun", rainy: false };
  if (code === 3) return { label: "Overcast", icon: "cloud", rainy: false };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "fog", rainy: false };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", icon: "rain", rainy: true };
  if ([61, 63, 65, 66, 67].includes(code)) return { label: "Rain", icon: "rain", rainy: true };
  if ([71, 73, 75, 77].includes(code)) return { label: "Snow", icon: "snow", rainy: true };
  if ([80, 81, 82].includes(code)) return { label: "Showers", icon: "rain", rainy: true };
  if (code === 85 || code === 86) return { label: "Snow showers", icon: "snow", rainy: true };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", icon: "storm", rainy: true };
  return { label: "Changeable", icon: "cloud", rainy: false };
}
