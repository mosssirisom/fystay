import { prisma } from "@/lib/prisma";
import { ensureTownsSeeded } from "@/lib/localData/seedTowns";
import { fetchOpenMeteoForecast, type OpenMeteoForecast } from "@/lib/localData/weatherSource";
import { describeWeatherCode, type WeatherCondition } from "@/lib/localData/weatherCodes";
import { runSync } from "@/lib/localData/syncLog";

// Weather changes slowly enough, and Open-Meteo is generous enough (no
// published rate limit for this volume of traffic), that refreshing every
// 45 minutes keeps every guest looking at genuinely current conditions
// without a server-rendered page ever waiting on a live fetch more than
// once per town per refresh window.
const WEATHER_TTL_MS = 45 * 60 * 1000;

export type TownWeatherDay = {
  date: string;
  maxC: number;
  minC: number;
  precipitationChancePercent: number;
  condition: WeatherCondition;
};

export type TownWeather = {
  townSlug: string;
  fetchedAt: Date;
  current: {
    temperatureC: number;
    windSpeedKmh: number;
    precipitationMm: number;
    condition: WeatherCondition;
  };
  daily: TownWeatherDay[];
};

/** Exported purely for unit testing - every real caller goes through getTownWeather below. */
export function normalize(townSlug: string, fetchedAt: Date, raw: OpenMeteoForecast): TownWeather {
  return {
    townSlug,
    fetchedAt,
    current: {
      temperatureC: Math.round(raw.current.temperature_2m),
      windSpeedKmh: Math.round(raw.current.wind_speed_10m),
      precipitationMm: raw.current.precipitation,
      condition: describeWeatherCode(raw.current.weather_code),
    },
    daily: raw.daily.time.map((date, i) => ({
      date,
      maxC: Math.round(raw.daily.temperature_2m_max[i]),
      minC: Math.round(raw.daily.temperature_2m_min[i]),
      precipitationChancePercent: raw.daily.precipitation_probability_max[i],
      condition: describeWeatherCode(raw.daily.weather_code[i]),
    })),
  };
}

/**
 * The one function anything in the app should call for weather - never
 * fetchOpenMeteoForecast directly. Serves a cached forecast when it's
 * still fresh, refreshes (and re-caches) it when stale, and - if the
 * refresh itself fails - falls back to whatever was last cached rather
 * than showing nothing, per the "keep working on last-known-good data"
 * requirement for every source here. Returns null only when the town
 * itself isn't real or nothing has ever been fetched for it and the first
 * fetch just failed.
 */
export async function getTownWeather(townSlug: string): Promise<TownWeather | null> {
  await ensureTownsSeeded();
  const town = await prisma.localTown.findUnique({ where: { slug: townSlug } });
  if (!town) return null;

  const cached = await prisma.weatherCache.findUnique({ where: { townSlug } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < WEATHER_TTL_MS) {
    return normalize(townSlug, cached.fetchedAt, {
      current: cached.current as OpenMeteoForecast["current"],
      daily: cached.daily as OpenMeteoForecast["daily"],
    });
  }

  try {
    const fresh = await runSync({ source: "OPEN_METEO", townSlug }, async () => {
      const raw = await fetchOpenMeteoForecast(town);
      await prisma.weatherCache.upsert({
        where: { townSlug },
        create: { townSlug, current: raw.current, daily: raw.daily },
        update: { current: raw.current, daily: raw.daily, fetchedAt: new Date() },
      });
      return { result: raw, recordCount: 1 };
    });
    return normalize(townSlug, new Date(), fresh);
  } catch {
    if (cached) {
      return normalize(townSlug, cached.fetchedAt, {
        current: cached.current as OpenMeteoForecast["current"],
        daily: cached.daily as OpenMeteoForecast["daily"],
      });
    }
    return null;
  }
}
