"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import type { FeaturedListing } from "@/lib/marketplace";
import { cn } from "@/lib/cn";

const ROTATE_INTERVAL_MS = 5000;

/**
 * The homepage hero's rotating spotlight: cycles through a handful of the
 * best-reviewed listings, each linking straight to its own page. All slides
 * are stacked and cross-faded (rather than mounted/unmounted) so rotating
 * never causes a layout shift or a fresh image decode mid-cycle.
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

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count]);

  return (
    <div className={cn("relative", className)} aria-label="Featured stays" role="group">
      {listings.map((listing, i) => (
        <Link
          key={listing.id}
          href={`/listings/${listing.id}`}
          aria-hidden={i !== active}
          tabIndex={i === active ? 0 : -1}
          className={cn(
            "absolute inset-0 block transition-opacity duration-700 motion-reduce:transition-none",
            i === active ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Image
            src={listing.photo}
            alt={listing.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
            unoptimized={!isOptimizableImage(listing.photo)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          {/* bottom-20/24 rather than a plain bottom-4/6: the search card
              below overlaps the hero's own bottom 56px (mobile) / 80px
              (desktop) via its negative top margin (see page.tsx), so
              anything anchored too close to the true bottom edge here
              would render underneath it. */}
          <div className="absolute inset-x-4 bottom-20 sm:inset-x-8 sm:bottom-24">
            <p className="truncate text-base font-semibold text-white sm:text-lg">{listing.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/90">
              <span>
                {listing.city}, {listing.country}
              </span>
              <span aria-hidden>·</span>
              <span className="font-medium">{formatPrice(listing.pricePerNightCents)}/night</span>
              {listing.rating !== null && (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                    {listing.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      ))}

      {count > 1 && (
        <div className="absolute right-4 top-4 z-10 flex gap-1.5 sm:right-8 sm:top-6">
          {listings.map((listing, i) => (
            <button
              key={listing.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${listing.title}`}
              aria-current={i === active}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
