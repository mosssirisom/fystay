"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import type { FeaturedListing } from "@/lib/marketplace";
import { AMENITY_CATEGORIES } from "@/lib/amenityCategories";
import { cn } from "@/lib/cn";
import { withCity } from "@/lib/seo";

const ROTATE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const MAX_FEATURE_ICONS = 3;

/**
 * The homepage hero's rotating spotlight: cycles through a handful of the
 * best-reviewed listings, each linking straight to its own page.
 *
 * All slides are mounted side by side in one flex track that's translated
 * by whole viewport widths, so a rotation is a genuine slide (the outgoing
 * and incoming photos move together) rather than the previous version's
 * mount/unmount-with-fade, which read as an abrupt cut on anything other
 * than a very fast crossfade. Listing photos here are self-contained data:
 * URIs (see seed.ts) with no network fetch behind them, so mounting all of
 * them up front costs nothing extra to look smooth.
 */
export function FeaturedListingHero({
  listings,
  className,
}: {
  listings: FeaturedListing[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const count = listings.length;
  const touchStartX = useRef<number | null>(null);

  function goTo(index: number) {
    setActive(((index % count) + count) % count);
  }

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Depends on `active` so a manual swipe/arrow/dot click restarts the
    // countdown instead of auto-advancing again a moment after the user
    // just chose a slide themselves.
    const id = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, active]);

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD_PX) goTo(active + 1);
    else if (delta >= SWIPE_THRESHOLD_PX) goTo(active - 1);
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      aria-label="Featured stays"
      role="group"
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
        onTouchStart={count > 1 ? handleTouchStart : undefined}
        onTouchEnd={count > 1 ? handleTouchEnd : undefined}
      >
        {listings.map((listing, i) => {
          const keyFeatures = AMENITY_CATEGORIES.filter((category) =>
            category.test(listing.amenities),
          ).slice(0, MAX_FEATURE_ICONS);

          return (
            // z-20 on the slide track and the controls below: page.tsx layers
            // a page-wide brand vignette over this whole hero at z-10 (for
            // the marketing headline's contrast), which - being a later
            // sibling of this component's root, with an explicit z-index of
            // its own - would otherwise paint above this photo and its
            // caption/controls entirely, not just tint them.
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="relative z-20 h-full w-full shrink-0"
            >
              <Image
                src={listing.photo}
                alt={withCity(listing.title, listing.city)}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
                unoptimized={!isOptimizableImage(listing.photo)}
              />
              {/* A tight, bottom-only scrim rather than a wash reaching
                  halfway up the photo - just enough for the caption text
                  below to stay legible, so the photo itself stays the
                  focal point instead of competing with a dark overlay. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 from-0% via-black/0 via-40% to-transparent" />
              {/* bottom-20/24 rather than a plain bottom-4/6: the search card
                  below overlaps the hero's own bottom 56px (mobile) / 80px
                  (desktop) via its negative top margin (see page.tsx), so
                  anything anchored too close to the true bottom edge here
                  would render underneath it. */}
              <div className="absolute inset-x-4 bottom-20 sm:inset-x-8 sm:bottom-24">
                <p className="truncate text-sm font-semibold text-white sm:text-base">
                  {listing.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{listing.city}</span>
                  {keyFeatures.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="flex items-center gap-1.5">
                        {keyFeatures.map((category) => (
                          <span key={category.key} title={category.label}>
                            <category.icon className="h-3 w-3" aria-hidden />
                            <span className="sr-only">{category.label}</span>
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatPrice(listing.pricePerNightCents)}
                  <span className="ml-1 text-xs font-normal text-white/70">/ night</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {count > 1 && (
        <>
          {/* Desktop-only prev/next - mobile relies on the swipe handlers
              on the track above, which read more natural on a touchscreen
              than small edge buttons. */}
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label="Previous stay"
            className="absolute left-2 top-[68%] z-20 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label="Next stay"
            className="absolute right-2 top-[68%] z-20 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute right-4 top-4 z-20 flex gap-1.5 sm:right-8 sm:top-6">
            {listings.map((l, i) => (
              <button
                key={l.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${l.title}`}
                aria-current={i === active}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
