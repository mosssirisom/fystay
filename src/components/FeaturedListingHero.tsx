"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import type { FeaturedListing } from "@/lib/marketplace";
import { cn } from "@/lib/cn";
import { withCity } from "@/lib/seo";

const ROTATE_INTERVAL_MS = 5000;

/**
 * The homepage hero's rotating spotlight: cycles through a handful of the
 * best-reviewed listings, each linking straight to its own page.
 *
 * Mounts only the *current* slide rather than stacking all of them
 * (opacity-toggled) at once: an earlier version did that for a true
 * crossfade, but it meant every listing's Link/Image/text was hydrated
 * up front - extra work with nothing to show for it, since this app's
 * listing photos are all self-contained data: URIs (see seed.ts) with no
 * network fetch to hide behind a crossfade in the first place. One mounted
 * slide plus a plain CSS fade-in on change reads almost as smoothly,
 * without paying for four listings nobody's looking at yet.
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

  const listing = listings[active];

  return (
    <div className={cn("relative", className)} aria-label="Featured stays" role="group">
      {/* z-20 on both the slide and the dots below: page.tsx layers a
          page-wide brand vignette over this whole hero at z-10 (for the
          marketing headline's contrast), which - being a later sibling of
          this component's root, with an explicit z-index of its own -
          would otherwise paint above this photo and its caption/dots
          entirely, not just tint them. An explicit z-20 here keeps this
          slide's own content above that vignette. */}
      <Link
        key={listing.id}
        href={`/listings/${listing.id}`}
        className="absolute inset-0 z-20 block animate-hero-fade-in"
      >
        <Image
          src={listing.photo}
          alt={withCity(listing.title, listing.city)}
          fill
          priority={active === 0}
          sizes="100vw"
          className="object-cover"
          unoptimized={!isOptimizableImage(listing.photo)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/10 to-transparent" />
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

      {count > 1 && (
        <div className="absolute right-4 top-4 z-20 flex gap-1.5 sm:right-8 sm:top-6">
          {listings.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${l.title}`}
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
