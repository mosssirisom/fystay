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
 * instead of autoplaying.
 *
 * The homepage hero's only backdrop - a pure video moment, not a rotating
 * spotlight through real listings (that's what search results and
 * destination pages are for).
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
      {/* No scrim of its own: page.tsx layers a top-and-bottom scrim over
          the whole hero section on top of this video. */}
    </div>
  );
}
