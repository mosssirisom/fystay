import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin, Star } from "lucide-react";
import { isOptimizableImage } from "@/lib/image";
import { formatProviderPrice } from "@/lib/format";
import { buildHotelSearchQuery } from "@/lib/hotelSearchParams";
import { destinationSlugFor, type HotelSearchCard } from "@/lib/hotelProviders/search";
import type { HotelSearchParams } from "@/lib/hotelProviders/types";

const MAX_FACILITY_TAGS = 3;

/**
 * The affiliate-hotel equivalent of ListingCard - deliberately simpler
 * (single static photo, no swipe carousel, no SaveButton/wishlist): those
 * only make sense for FYStay's own listings, and giving an affiliate result
 * a "Save" heart would misleadingly imply FYStay has some ongoing
 * relationship with it beyond a single outbound click. Links to this app's
 * own /hotels/[destination]/[hotelSlug] page, never straight to the
 * provider - the deep link only ever appears on that detail page, built
 * server-side (see this package's own top-of-file comments).
 */
export function HotelResultCard({
  hotel,
  searchParams,
}: {
  hotel: HotelSearchCard;
  /** The dates/guests this result was found under - carried into the
   * detail page's URL so its "available deals" reflect the exact stay the
   * guest already searched for, rather than some arbitrary default. */
  searchParams: HotelSearchParams;
}) {
  const query = buildHotelSearchQuery({ ...searchParams, destination: "" });
  const href = `/hotels/${destinationSlugFor(hotel.city)}/${hotel.slug}${query ? `?${query}` : ""}`;
  const facilities = hotel.facilities.slice(0, MAX_FACILITY_TAGS);

  return (
    <div className="group flex flex-col gap-3.5 transition-transform duration-300 hover:-translate-y-1 focus-within:-translate-y-1 active:scale-[0.98]">
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-brand-50 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-[var(--shadow-card-hover)] group-hover:ring-brand-200">
        <Link href={href} className="focus-ring absolute inset-0 block rounded-2xl">
          {hotel.primaryPhotoUrl ? (
            <Image
              src={hotel.primaryPhotoUrl}
              alt={hotel.name}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={!isOptimizableImage(hotel.primaryPhotoUrl)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-brand-300">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs font-medium text-brand-400">Photo coming soon</span>
            </div>
          )}
        </Link>

        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-stone-700 shadow-[var(--shadow-card)] backdrop-blur-sm">
          Via {hotel.providerName}
        </span>
      </div>

      <Link href={href} className="focus-ring flex flex-col gap-2 rounded-xl">
        <p className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug tracking-tight text-foreground transition-colors duration-200 group-hover:text-brand-800">
          {hotel.name}
        </p>
        <p className="flex items-center gap-1 text-sm text-stone-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          <span className="truncate">
            {hotel.city}, {hotel.country}
          </span>
        </p>

        {facilities.length > 0 && (
          <ul className="flex flex-wrap items-center gap-1.5">
            {facilities.map((facility) => (
              <li
                key={facility}
                className="rounded-full border border-border-subtle bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-stone-600"
              >
                {facility}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2.5 flex items-start justify-between gap-2">
          <p className="flex items-baseline gap-1">
            <span className="font-serif text-xl tabular-nums text-brand-800">
              {formatProviderPrice(hotel.priceCents, hotel.currency)}
            </span>
            <span className="text-xs text-stone-500">/ night</span>
          </p>
          {hotel.guestRating != null ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-1 text-xs font-medium text-stone-700">
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" aria-hidden />
              {hotel.guestRating.toFixed(1)}
              {hotel.reviewCount ? (
                <span className="text-stone-500">({hotel.reviewCount})</span>
              ) : null}
            </span>
          ) : hotel.starRating != null ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-1 text-xs font-medium text-stone-700">
              {hotel.starRating}
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" aria-hidden />
            </span>
          ) : null}
        </div>

        <span className="mt-1 inline-flex w-fit items-center rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-brand-800">
          View deal
        </span>
      </Link>
    </div>
  );
}
