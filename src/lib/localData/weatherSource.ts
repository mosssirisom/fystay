/**
 * The raw Open-Meteo client - free, keyless, no signup required. This is
 * the only file that knows Open-Meteo's URL shape; src/lib/localData/
 * weather.ts (the cache-aware layer everything else calls) depends only on
 * the OpenMeteoForecast type below, so swapping weather providers later
 * (see the schema's own doc comment on WeatherCache about not needing a
 * migration for provider changes) means changing this file alone.
 */

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 8000;

export type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  precipitation: number;
};

export type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
};

export type OpenMeteoForecast = {
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
};

export async function fetchOpenMeteoForecast(coordinates: {
  latitude: number;
  longitude: number;
}): Promise<OpenMeteoForecast> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", coordinates.latitude.toFixed(4));
  url.searchParams.set("longitude", coordinates.longitude.toFixed(4));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,precipitation");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }
  return response.json() as Promise<OpenMeteoForecast>;
}
