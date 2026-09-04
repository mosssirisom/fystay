"use client";

import { useRef, useState } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff, MapPin, Star, Users } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import { computeBookingPricing } from "@/lib/pricing";
import { SaveButton } from "@/components/SaveButton";
import { averageRating as computeAverageRating } from "@/lib/reviews";
import { AMENITY_CATEGORIES } from "@/lib/amenityCategories";
import { cn } from "@/lib/cn";
import { withCity } from "@/lib/seo";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNightCents: number;
  cleaningFeeCents: number;
  photos: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  reviews: { rating: number }[];
};

const MAX_AMENITY_ICONS = 3;
const SWIPE_THRESHOLD_PX = 30;

export function ListingCard({
  listing,
  isSaved = false,
  isLoggedIn = false,
  nights,
}: {
  listing: ListingCardData;
  isSaved?: boolean;
  isLoggedIn?: boolean;
  /** Length of the stay currently searched for, if any - when set, the
   * card shows the total price for that stay next to the nightly rate
   * (search results only; browse carousels don't have a date range). */
  nights?: number;
}) {
  const rating = computeAverageRating(listing.reviews);
  const reviewCount = listing.reviews.length;
  const keyAmenities = AMENITY_CATEGORIES.filter((category) =>
    category.test(listing.amenities),
  ).slice(0, MAX_AMENITY_ICONS);

  const photoCount = listing.photos.length;
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function goToPhoto(index: number) {
    setPhotoIndex(((index % photoCount) + photoCount) % photoCount);
  }

  // Swiping across the photo shouldn't also navigate to the listing:
  // mobile browsers already suppress the anchor's click event once a touch
  // has moved past a small threshold, so changing the index here on
  // touchend is enough - a plain tap (no meaningful movement) still falls
  // through to the Link underneath as a normal navigation.
  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD_PX) goToPhoto(photoIndex + 1);
    else if (delta >= SWIPE_THRESHOLD_PX) goToPhoto(photoIndex - 1);
  }

  const totalPriceCents =
    nights && nights > 0
      ? computeBookingPricing({
          nights,
          pricePerNightCents: listing.pricePerNightCents,
          cleaningFeeCents: listing.cleaningFeeCents,
        }).totalPriceCents
      : null;

  return (
    // The lift-on-hover applies to the whole card (image and text together)
    // rather than just zooming the photo - a plain `hover:` here, not
    // `group-hover:`, since :hover already bubbles up to this element from
    // either Link inside it. transition-transform is separate from the
    // image's own transition so the two don't fight over timing.
    <div className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1 focus-within:-translate-y-1">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-brand-50 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-[var(--shadow-card-hover)] group-hover:ring-brand-200">
        <Link
          href={`/listings/${listing.id}`}
          className="focus-ring absolute inset-0 block rounded-2xl"
          onTouchStart={photoCount > 1 ? handleTouchStart : undefined}
          onTouchEnd={photoCount > 1 ? handleTouchEnd : undefined}
        >
          {photoCount > 0 ? (
            <div
              className="flex h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${photoIndex * 100}%)` }}
            >
              {listing.photos.map((photo, i) => (
                <div key={i} className="relative h-full w-full shrink-0">
                  <Image
                    src={photo}
                    alt={withCity(listing.title, listing.city)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={!isOptimizableImage(photo)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-brand-300">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs font-medium text-brand-400">Photo coming soon</span>
            </div>
          )}
        </Link>

        {photoCount > 1 && (
          <>
            {/* Desktop-only prev/next, shown on hover - mobile relies on
                the swipe handlers on the Link above instead. Siblings of
                the Link rather than nested inside it, so a click here
                changes the photo without also triggering navigation. */}
            <button
              type="button"
              onClick={() => goToPhoto(photoIndex - 1)}
              aria-label="Previous photo"
              className="absolute left-1.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-1 text-foreground opacity-0 shadow-[var(--shadow-card)] backdrop-blur-sm transition hover:bg-white group-hover:opacity-100 sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPhoto(photoIndex + 1)}
              aria-label="Next photo"
              className="absolute right-1.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-1 text-foreground opacity-0 shadow-[var(--shadow-card)] backdrop-blur-sm transition hover:bg-white group-hover:opacity-100 sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1">
              {listing.photos.map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    i === photoIndex ? "bg-white" : "bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        )}

        <SaveButton
          listingId={listing.id}
          initialSaved={isSaved}
          isLoggedIn={isLoggedIn}
          className="absolute right-2.5 top-2.5 z-10 h-10 w-10 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur-sm hover:bg-white active:scale-90"
        />
      </div>
      <Link href={`/listings/${listing.id}`} className="focus-ring flex flex-col gap-1.5 rounded-xl">
        {/* min-h keeps this row the same height whether the title wraps to
            one line or two, so price/rating rows still line up across a
            row of cards regardless of title length. */}
        <p
          data-testid="listing-card-title"
          className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-brand-800"
        >
          {listing.title}
        </p>
        <p className="flex items-center gap-1 text-sm text-zinc-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          <span className="truncate">
            {listing.city}, {listing.country}
          </span>
        </p>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {listing.maxGuests} guest{listing.maxGuests === 1 ? "" : "s"}
          <span aria-hidden>·</span>
          {listing.bedrooms} bedroom{listing.bedrooms === 1 ? "" : "s"}
        </p>
        {keyAmenities.length > 0 && (
          <ul className="flex items-center gap-2.5">
            {keyAmenities.map((category) => (
              <li key={category.key} className="flex items-center gap-1 text-xs text-zinc-500">
                <category.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{category.label}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="flex flex-wrap items-baseline gap-x-1">
            <span className="text-base font-bold text-brand-800">
              {formatPrice(listing.pricePerNightCents)}
            </span>
            <span className="text-xs text-zinc-500">/ night</span>
            {totalPriceCents !== null && (
              <span className="text-xs text-zinc-500">
                · {formatPrice(totalPriceCents)} total
              </span>
            )}
          </p>
          {rating !== null ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-600">
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
              {rating.toFixed(1)}
              {reviewCount > 0 && <span className="text-zinc-500">({reviewCount})</span>}
            </span>
          ) : (
            // A blank gap here (rather than a placeholder) reads as broken
            // or missing data next to cards that do have a rating in the
            // same grid - and every listing starts with zero reviews, so
            // this isn't a rare case. "New" reframes it as a fact about
            // the listing instead of an absence.
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              New
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
