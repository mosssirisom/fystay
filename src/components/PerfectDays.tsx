import { Car, Footprints, MapPin, Route } from "lucide-react";
import { PERFECT_DAY_META, PERFECT_DAYS } from "@/lib/perfectDays";
import { locateEntry, type OriginListing } from "@/lib/guideLocation";
import { SectionHeading } from "@/components/SectionHeading";

/**
 * Ready-made itineraries - a sensible order to spend a day, not a new
 * source of facts. Each step reuses a place the rest of the guide already
 * names (see perfectDays.ts), so distance/walk badges here come from the
 * same guideLocation.ts math as everywhere else on the page.
 */
export function PerfectDays({
  townSlug,
  destinationName,
  fromListing,
}: {
  townSlug: string;
  destinationName: string;
  fromListing: OriginListing | null;
}) {
  const days = PERFECT_DAYS[townSlug];
  if (!days || days.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionHeading icon={Route}>Perfect Days in {destinationName}</SectionHeading>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Ready-made plans for however you want to spend the day - pick one and go.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const meta = PERFECT_DAY_META.find((m) => m.key === day.key);
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={day.key} className="rounded-2xl border border-border-subtle bg-surface p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="font-semibold text-foreground">{meta.label}</p>
              </div>
              <ol className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
                {day.steps.map((step, i) => {
                  const location = locateEntry(fromListing, step.place);
                  return (
                    <li key={i} className="text-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">{step.time}</p>
                      <p className="mt-0.5 text-foreground">{step.activity}</p>
                      {location && (
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            {location.distanceMiles} mi
                          </span>
                          {location.walkMinutes !== null && (
                            <span className="flex items-center gap-1">
                              <Footprints className="h-3 w-3 shrink-0" aria-hidden />
                              ~{location.walkMinutes} min
                            </span>
                          )}
                          {location.driveMinutes !== null && (
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3 shrink-0" aria-hidden />
                              ~{location.driveMinutes} min
                            </span>
                          )}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
