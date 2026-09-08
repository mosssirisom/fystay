import {
  Baby,
  Beer,
  Car,
  Cloud,
  CloudRain,
  Coffee,
  Footprints,
  Landmark,
  MapPin,
  Mountain,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Trees,
  UtensilsCrossed,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { EditorialTag, LocalPlaceCategory } from "@prisma/client";
import type { WeatherCondition } from "@/lib/localData/weatherCodes";
import type { ConciergeSnapshot } from "@/lib/localData/concierge";
import { Badge } from "@/components/ui/Badge";

const CATEGORY_ICON: Record<LocalPlaceCategory, LucideIcon> = {
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  PUB: Beer,
  SHOP: ShoppingBag,
  SUPERMARKET: ShoppingCart,
  PHARMACY: Pill,
  PARK: Trees,
  BEACH: Waves,
  PLAYGROUND: Baby,
  ATTRACTION: Star,
  MUSEUM: Landmark,
  TOILET: MapPin,
  PARKING: Car,
  EV_CHARGING: Zap,
  VIEWPOINT: Mountain,
  OTHER: MapPin,
};

const CATEGORY_LABEL: Record<LocalPlaceCategory, string> = {
  RESTAURANT: "Restaurant",
  CAFE: "Café",
  PUB: "Pub",
  SHOP: "Shop",
  SUPERMARKET: "Supermarket",
  PHARMACY: "Pharmacy",
  PARK: "Park",
  BEACH: "Beach",
  PLAYGROUND: "Playground",
  ATTRACTION: "Attraction",
  MUSEUM: "Museum",
  TOILET: "Toilets",
  PARKING: "Parking",
  EV_CHARGING: "EV charging",
  VIEWPOINT: "Viewpoint",
  OTHER: "Local spot",
};

const EDITORIAL_LABEL: Record<EditorialTag, string> = {
  FYSTAY_PICK: "FYStay Pick",
  HIDDEN_GEM: "Hidden gem",
  BEST_FOR_FAMILIES: "Best for families",
  BEST_FOR_COUPLES: "Best for couples",
  BEST_CHEAP_EAT: "Best cheap eat",
  BEST_BREAKFAST: "Best breakfast",
  BEST_BEACH: "Best beach",
  BEST_WALK: "Best walk",
  BEST_RAINY_DAY: "Best for a rainy day",
};

const WEATHER_ICON: Record<WeatherCondition["icon"], LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudRain,
  fog: Cloud,
};

/**
 * The "Right now" concierge panel - the one part of the Local Guide that's
 * live rather than written once and left, per the "premium concierge, not
 * an API directory" brief: current weather plus a short, ranked spotlight
 * combining whatever OSM places have synced for this town with FYStay's own
 * editorial picks (recommendationEngine.ts does the merging and scoring).
 * Every source fails safe upstream, so the only two states this ever
 * renders are "here's what we've got" and, when neither weather nor a
 * single recommendation is available yet, one honest placeholder - never a
 * broken layout or a fabricated pick.
 */
export function LocalConcierge({
  destinationName,
  snapshot,
}: {
  destinationName: string;
  snapshot: ConciergeSnapshot;
}) {
  const { weather, recommendations } = snapshot;

  if (!weather && recommendations.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-border-subtle bg-surface-muted p-6 text-sm text-zinc-500">
        We&apos;re still building live local data for {destinationName} - check back soon for real-time
        recommendations.
      </div>
    );
  }

  const WeatherIcon = weather ? WEATHER_ICON[weather.current.condition.icon] : null;

  return (
    <div className="mt-6 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-surface p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">Right now in {destinationName}</p>
            <p className="text-xs text-zinc-500">Live picks from FYStay&apos;s local concierge</p>
          </div>
        </div>

        {weather && WeatherIcon && (
          <div className="flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm">
            <WeatherIcon className="h-4 w-4 text-brand-600" aria-hidden />
            {weather.current.temperatureC}°C · {weather.current.condition.label}
          </div>
        )}
      </div>

      {recommendations.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => {
            const Icon = CATEGORY_ICON[rec.category];
            return (
              <li key={rec.id} className="rounded-2xl border border-border-subtle bg-white/80 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {CATEGORY_LABEL[rec.category]}
                  </div>
                  {rec.editorialTag && (
                    <Badge variant="brand" className="shrink-0">
                      {EDITORIAL_LABEL[rec.editorialTag]}
                    </Badge>
                  )}
                </div>

                <p className="mt-1.5 font-semibold text-foreground">{rec.name}</p>
                {rec.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600">{rec.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  {rec.distanceMiles !== null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {rec.distanceMiles} mi
                    </span>
                  )}
                  {rec.walkMinutes !== null && (
                    <span className="flex items-center gap-1">
                      <Footprints className="h-3 w-3 shrink-0" aria-hidden />
                      ~{rec.walkMinutes} min walk
                    </span>
                  )}
                  {rec.openNow !== null && (
                    <span className={rec.openNow ? "font-medium text-emerald-700" : "font-medium text-zinc-400"}>
                      {rec.openNow ? "Open now" : "Closed now"}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          Live recommendations for {destinationName} are still being gathered - check back soon.
        </p>
      )}
    </div>
  );
}
