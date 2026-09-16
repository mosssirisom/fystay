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
 * Color-graded (a contrast/saturation lift via CSS filter, plus a warm
 * terracotta wash blended over the top) rather than left as flat, bright
 * drone-camera footage - the difference between "generic stock clip" and
 * something that reads as this brand's own. The loop point itself is a
 * short crossfade, not a hard cut, so it never announces itself as a loop.
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
// Applied to both the video and its still poster so neither one reads as
// flat/untouched footage - a contrast + saturation lift pulls the sky and
// sand out of the slightly hazy midday flatness the raw footage has, short
// of anything heavy enough to look like a filter rather than a grade.
const GRADE_FILTER = "contrast(1.12) saturate(1.15) brightness(0.96)";

export function HeroBanner({ className }: { className?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-ink", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/videos/hero-blackpool-pier-poster.jpg"
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover object-[100%_center] motion-reduce:block"
        style={{ filter: GRADE_FILTER }}
        aria-hidden
      />
      <video
        className="absolute inset-0 h-full w-full object-cover object-[100%_center] motion-reduce:hidden"
        style={{ filter: GRADE_FILTER }}
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
      {/* Warm terracotta wash, blended (not just laid on top) so it tints
          the footage's own tones rather than sitting over them like a
          sheet of colored glass - the brand-500 clay color already used
          for the search button/wordmark, at low opacity, is what actually
          makes this read as "this brand's own scenery" rather than
          generic coastal drone stock. No scrim/vignette here: page.tsx
          layers the top-and-bottom legibility scrim over the whole hero
          section on top of this. */}
      <div
        className="pointer-events-none absolute inset-0 bg-brand-600 mix-blend-soft-light"
        style={{ opacity: 0.35 }}
        aria-hidden
      />
    </div>
  );
}
