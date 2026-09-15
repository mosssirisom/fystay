import { cn } from "@/lib/cn";

/**
 * The homepage's full-bleed hero backdrop: real, licensed aerial footage of
 * Blackpool's beach, pier and Tower (self-hosted under public/videos/ - see
 * DESTINATION_PHOTOS.ts for the same "real, licensed media only" rule this
 * codebase already applies to every other photo), muted/looped/autoplaying
 * so it reads as ambient scenery rather than something the visitor is meant
 * to actively watch. `prefers-reduced-motion` swaps it for the still poster
 * frame instead of autoplaying - the same motion-safe/motion-reduce split
 * already used for the Ken Burns effect on FeaturedListingHero's photos.
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
        className="absolute inset-0 hidden h-full w-full object-cover motion-reduce:block"
        aria-hidden
      />
      <video
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        src="/videos/hero-blackpool-pier.mp4"
        poster="/videos/hero-blackpool-pier-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
    </div>
  );
}
