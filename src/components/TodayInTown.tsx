import { format } from "date-fns";
import { CalendarClock, MapPin, Sparkles } from "lucide-react";
import type { LocalEvent } from "@prisma/client";
import type { TownWeather } from "@/lib/localData/weather";
import type { LocalRecommendation } from "@/lib/localData/recommendationEngine";
import { describeWeatherPlan } from "@/lib/localData/weatherPlan";
import { WeatherIcon } from "@/components/WeatherIcon";
import { Badge } from "@/components/ui/Badge";

/**
 * The town guide's most prominent live section: today's actual weather,
 * today's ticketed events (a subset of the full What's On list further
 * down the page), and a short, honest "recommended for today" strip pulled
 * from the same weather-aware ranking every other live section uses -
 * never a separate, invented recommendation just for this card.
 *
 * Renders nothing when there's neither a weather reading nor a single
 * recommendation for this town yet (a brand new town with no live sync),
 * rather than an empty shell.
 */
export function TodayInTown({
  destinationName,
  weather,
  todaysEvents,
  recommended,
}: {
  destinationName: string;
  weather: TownWeather | null;
  todaysEvents: LocalEvent[];
  recommended: LocalRecommendation[];
}) {
  if (!weather && recommended.length === 0) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-900 to-brand-950 text-white">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 text-brand-200">
          <Sparkles className="h-4 w-4" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide">Today in {destinationName}</p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {weather && (
            <div>
              <div className="flex items-center gap-3">
                <WeatherIcon icon={weather.current.condition.icon} className="h-10 w-10 text-amber-300" />
                <div>
                  <p className="text-3xl font-bold">{weather.current.temperatureC}°C</p>
                  <p className="text-sm text-white/70">{weather.current.condition.label}</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">
                {describeWeatherPlan(weather.current.condition, weather.current.temperatureC)}
              </p>
            </div>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-200">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Today&apos;s events
            </p>
            {todaysEvents.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {todaysEvents.slice(0, 4).map((event) => (
                  <li key={event.id} className="flex items-baseline gap-2.5 text-sm">
                    <span className="font-mono text-xs tabular-nums text-brand-200">{format(event.startsAt, "HH:mm")}</span>
                    <span className="font-medium text-white">{event.name}</span>
                    {event.venueName && <span className="text-white/60">· {event.venueName}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-white/60">
                No ticketed events found for today - see What&apos;s On below for upcoming dates.
              </p>
            )}
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Recommended for today</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {recommended.slice(0, 3).map((rec) => (
                <li key={rec.id}>
                  <Badge variant="neutral" className="border border-white/15 bg-white/10 text-white">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {rec.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
