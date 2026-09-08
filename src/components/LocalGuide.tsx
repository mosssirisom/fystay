import { Compass, Quote, Sparkles } from "lucide-react";
import { LOCAL_GUIDES } from "@/lib/localGuide";
import type { FyldeCoastDestination } from "@/lib/destinations";
import { SectionHeading } from "@/components/SectionHeading";
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
 */
export function LocalGuide({ destination }: { destination: FyldeCoastDestination }) {
  const guide = LOCAL_GUIDES[destination.slug];
  if (!guide) return null;

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

      <blockquote className="mt-6 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <Quote className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <p className="text-sm italic leading-relaxed text-brand-900">{guide.insiderTip}</p>
      </blockquote>

      <LocalKnowledge destinationName={destination.name} slug={destination.slug} />

      <LocalGuideExplorer guide={guide} destinationName={destination.name} />
    </section>
  );
}
