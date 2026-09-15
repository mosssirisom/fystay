import Link from "next/link";
import { MapPin } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";
import { DESTINATION_ART } from "@/components/ExploreDestinations";
import { DESTINATION_PHOTOS } from "@/lib/destinationPhotos";
import { cn } from "@/lib/cn";

export const metadata = pageMetadata({
  title: "Destinations",
  description: "Every Fylde Coast town FYStay covers - Blackpool, Lytham St Annes, Cleveleys, Fleetwood and Bispham.",
  path: "/destinations",
});

/** Fallback look for a town with no bespoke icon/gradient in DESTINATION_ART yet (currently just Bispham) - a generic pin on a neutral ink gradient, rather than skipping it from this, the one page meant to list every town FYStay covers. */
const FALLBACK_ART = { icon: MapPin, gradient: "from-stone-500 to-ink" };

export default function DestinationsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Destinations</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-500 sm:text-base">
        Every Fylde Coast town FYStay covers, from Blackpool&rsquo;s promenade to Fleetwood&rsquo;s
        fishing port - pick a town for local stays, a Local Guide and what&rsquo;s on nearby.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {FYLDE_COAST_DESTINATIONS.map((destination) => {
          const art = DESTINATION_ART[destination.slug] ?? FALLBACK_ART;
          const Icon = art.icon;
          const photoSrc = DESTINATION_PHOTOS[destination.slug]?.tile;

          return (
            <Link
              key={destination.slug}
              href={`/destinations/${destination.slug}`}
              className={cn(
                "focus-ring group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br p-5 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)]",
                art.gradient,
              )}
            >
              {photoSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                </>
              ) : (
                <Icon
                  className="absolute -right-4 -top-4 h-36 w-36 text-white/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  aria-hidden
                />
              )}
              <div className="relative">
                <p className="text-lg font-bold text-white sm:text-xl">{destination.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/85 sm:text-sm">
                  {destination.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
