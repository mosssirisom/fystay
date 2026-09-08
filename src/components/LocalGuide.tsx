import { Compass, MapPin, Quote, Sparkles } from "lucide-react";
import { LOCAL_GUIDES } from "@/lib/localGuide";
import type { FyldeCoastDestination } from "@/lib/destinations";
import type { OriginListing } from "@/lib/guideLocation";
import { buildConciergeSnapshot, type ConciergeSources } from "@/lib/localData/concierge";
import { SectionHeading } from "@/components/SectionHeading";
import { LocalConcierge } from "@/components/LocalConcierge";
import { LocalGuideExplorer } from "@/components/LocalGuideExplorer";
import { LocalKnowledge } from "@/components/LocalKnowledge";
import { Badge } from "@/components/ui/Badge";

/**
 * The FYStay Local Guide - the thing neither Airbnb nor Booking.com give a
 * guest: a full, opinionated brief on the town itself, not just the four
 * walls being booked. This wrapper (heading, intro, insider tip) stays a
 * server component with no interactivity of its own; the "what are you
 * looking for" mood picker and the category grid it reorders live in
 * LocalGuideExplorer, the one piece of this section that actually needs to
 * be a client component.
 *
 * `fromListing`, when present (a guest arrived via a specific listing's
 * "Read the full Local Guide" link), makes the whole section
 * location-aware: real distance/walk/drive-time badges on every entry that
 * names a real place, and each category's entries reordered closest-first -
 * the same origin also drives the live "Right now" concierge panel's
 * distances below.
 *
 * `conciergeSources` is the raw weather/places/editorial data the page
 * already fetched in parallel with `fromListing`; merging it into a ranked
 * snapshot happens here, synchronously, once both have resolved.
 */
export function LocalGuide({
  destination,
  fromListing,
  conciergeSources,
}: {
  destination: FyldeCoastDestination;
  fromListing: OriginListing | null;
  conciergeSources: ConciergeSources;
}) {
  const guide = LOCAL_GUIDES[destination.slug];
  if (!guide) return null;

  const concierge = buildConciergeSnapshot(conciergeSources, fromListing);

  return (
    <section id="local-guide" className="mt-14 scroll-mt-20 border-t border-border-subtle pt-10">
      <Badge variant="brand">
        <Sparkles className="h-3 w-3" aria-hidden />
        Only on FYStay
      </Badge>
      <div className="mt-3">
        <SectionHeading icon={Compass}>{destination.name} Local Guide</SectionHeading>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        Everything you need for a trip to {destination.name} in one place - written by people who
        actually know this stretch of coast, not scraped from a review site.
      </p>

      {fromListing && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Distances and order below are relative to {fromListing.title}
        </p>
      )}

      <LocalConcierge destinationName={destination.name} snapshot={concierge} />

      <blockquote className="mt-6 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <Quote className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <p className="text-sm italic leading-relaxed text-brand-900">{guide.insiderTip}</p>
      </blockquote>

      <LocalKnowledge destinationName={destination.name} slug={destination.slug} fromListing={fromListing} />

      <LocalGuideExplorer guide={guide} destinationName={destination.name} fromListing={fromListing} />
    </section>
  );
}
