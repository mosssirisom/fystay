import { Car, Footprints, MapPin, MapPinned } from "lucide-react";
import type { LocalPlaceCategory } from "@prisma/client";
import type { LocalRecommendation } from "@/lib/localData/recommendationEngine";
import type { TownGuide } from "@/lib/localGuide";
import { locateEntry, type OriginListing } from "@/lib/guideLocation";
import { SectionHeading } from "@/components/SectionHeading";

const GROUPS: { label: string; categories: LocalPlaceCategory[] }[] = [
  { label: "Restaurants & cafés", categories: ["RESTAURANT", "CAFE", "PUB"] },
  { label: "Things to do", categories: ["ATTRACTION", "MUSEUM", "VIEWPOINT", "PARK", "PLAYGROUND", "BEACH"] },
  { label: "Shops & essentials", categories: ["SHOP", "SUPERMARKET", "PHARMACY"] },
  { label: "Parking", categories: ["PARKING"] },
];

/**
 * "Near Your Stay" - the one section on this page that only exists when a
 * guest arrived via a specific listing (see the destination page's
 * `?from=` handling). Groups the same distance-ranked `nearby` list
 * (concierge.ts's unfiltered recommendations, including the utility
 * categories the main spotlight deliberately excludes) into the
 * categories the brief asks for, plus the guide's own static transport
 * entries - the one thing OSM doesn't give this app live (no bus/tram stop
 * data is fetched today), so it falls back to the same real, named
 * transport options the rest of the guide already lists.
 */
export function NearYourStay({
  destinationName,
  fromListing,
  nearby,
  guide,
}: {
  destinationName: string;
  fromListing: OriginListing | null;
  nearby: LocalRecommendation[];
  guide: TownGuide;
}) {
  if (!fromListing) {
    return (
      <section className="mt-10 rounded-3xl border border-dashed border-border-subtle bg-surface-muted p-6">
        <SectionHeading icon={MapPinned}>Near Your Stay</SectionHeading>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Come back here from one of our {destinationName} listings and this section shows real walking and
          driving times to everything nearby, from your exact property.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <SectionHeading icon={MapPinned}>Near Your Stay</SectionHeading>
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Distances below are relative to {fromListing.title}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {GROUPS.map((group) => {
          const items = nearby.filter((rec) => group.categories.includes(rec.category)).slice(0, 4);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="rounded-2xl border border-border-subtle bg-surface p-5">
              <p className="font-semibold text-foreground">{group.label}</p>
              <ul className="mt-3 flex flex-col gap-2.5 border-t border-border-subtle pt-3">
                {items.map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                      {item.distanceMiles !== null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                          {item.distanceMiles} mi
                        </span>
                      )}
                      {item.walkMinutes !== null && (
                        <span className="flex items-center gap-1">
                          <Footprints className="h-3 w-3 shrink-0" aria-hidden />
                          ~{item.walkMinutes} min walk
                        </span>
                      )}
                      {item.driveMinutes !== null && (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3 shrink-0" aria-hidden />
                          ~{item.driveMinutes} min drive
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {guide.transport.length > 0 && (
          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <p className="font-semibold text-foreground">Transport</p>
            <ul className="mt-3 flex flex-col gap-2.5 border-t border-border-subtle pt-3">
              {guide.transport.map((entry) => {
                const location = locateEntry(fromListing, entry.place);
                return (
                  <li key={entry.name} className="text-sm">
                    <p className="font-medium text-foreground">{entry.name}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{entry.note}</p>
                    {location && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                          {location.distanceMiles} mi
                        </span>
                        {location.walkMinutes !== null && (
                          <span className="flex items-center gap-1">
                            <Footprints className="h-3 w-3 shrink-0" aria-hidden />
                            ~{location.walkMinutes} min walk
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
