import { cn } from "@/lib/cn";

/**
 * The homepage's full-bleed hero backdrop: real, licensed aerial footage of
 * Blackpool's beach, pier and Tower (self-hosted under public/videos/ - see
 * DESTINATION_PHOTOS.ts for the same "real, licensed media only" rule this
 * codebase already applies to every other photo), muted/looped/autoplaying
 * so it reads as ambient scenery rather than something the visitor is meant
 * to actively watch - subtle motion behind the headline and search card,
 * never the thing competing for attention with them.
 *
 * Color-graded once (gentle contrast lift, a touch of desaturation, a soft
 * vignette) rather than left as flat, bright drone-camera footage - the
 * difference between "generic stock clip" and something that reads as this
 * brand's own. The loop point itself is a short crossfade, not a hard cut,
 * so it never announces itself as a loop.
 *
 * Two encodes: a full 1280x720 file for tablet/desktop, and a smaller
 * 854x480/~850kbps one swapped in under 640px (mobile data is precious,
 * and a hero video is the single heaviest thing on the page). Both are the
 * same footage, so `object-position` only needs one value that keeps the
 * Tower in frame at every crop - see the class below.
 *
 * `prefers-reduced-motion` swaps the whole thing for the still poster frame
 * instead of autoplaying - the same motion-safe/motion-reduce split already
 * used for the Ken Burns effect on FeaturedListingHero's photos.
 *
 * Falls back to this (not the rotating FeaturedListingHero) only while the
 * real featured-listings query is loading, or once the catalog is big
 * enough that a listing's own photo can't carry the whole hero yet - see
 * FeaturedHero in page.tsx for exactly when each one renders.
 */
export function HeroBanner({ className }: { className?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-ink", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/videos/hero-blackpool-pier-poster.jpg"
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover object-[100%_center] motion-reduce:block"
        aria-hidden
      />
      <video
        className="absolute inset-0 h-full w-full object-cover object-[100%_center] motion-reduce:hidden"
        poster="/videos/hero-blackpool-pier-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src="/videos/hero-blackpool-pier-mobile.mp4" media="(max-width: 640px)" type="video/mp4" />
        <source src="/videos/hero-blackpool-pier.mp4" type="video/mp4" />
      </video>
      {/* A light scrim over the top third only, where the headline sits -
          the rest of the footage is left untouched so the video still
          reads as the focal point, not something dimmed out from under
          the text. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/35 to-transparent" />
    </div>
  );
}
