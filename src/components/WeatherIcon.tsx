import { Cloud, CloudRain, Snowflake, Sun, type LucideIcon } from "lucide-react";
import type { WeatherCondition } from "@/lib/localData/weatherCodes";

const WEATHER_ICON: Record<WeatherCondition["icon"], LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudRain,
  fog: Cloud,
};

/** Shared icon-per-condition mapping so every weather chip on the site (hero, "Today in town") agrees on what a given Open-Meteo condition looks like. */
export function WeatherIcon({ icon, className }: { icon: WeatherCondition["icon"]; className?: string }) {
  const Icon = WEATHER_ICON[icon];
  return <Icon className={className} aria-hidden />;
}
