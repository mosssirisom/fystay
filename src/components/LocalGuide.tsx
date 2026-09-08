import { Quote } from "lucide-react";
import { LOCAL_GUIDES } from "@/lib/localGuide";
import type { FyldeCoastDestination } from "@/lib/destinations";
import type { OriginListing } from "@/lib/guideLocation";
import { buildConciergeSnapshot, eventsToday, type ConciergeSources } from "@/lib/localData/concierge";
import { QuickDiscoveryNav } from "@/components/QuickDiscoveryNav";
import { PersonalizedGuideSection } from "@/components/PersonalizedGuideSection";
import { TodayInTown } from "@/components/TodayInTown";
import { HiddenGems } from "@/components/HiddenGems";
import { PerfectDays } from "@/components/PerfectDays";
import { NearYourStay } from "@/components/NearYourStay";
import { WhatsOn } from "@/components/WhatsOn";
import { LocalKnowledge } from "@/components/LocalKnowledge";

/**
 * The FYStay Local Guide - the thing neither Airbnb nor Booking.com give a
 * guest: a full, premium concierge brief on the town itself, not just the
 * four walls being booked. The hero and the "Accommodation in X" listings
 * above this (see the destination page) are the only parts of the page not
 * owned by this component; everything else - quick discovery, personalised
 * picks, live "today" and "what's on", hidden gems, perfect days, and the
 * distance-aware "near your stay" breakdown - lives here.
 *
 * `fromListing`, when present (a guest arrived via a specific listing's
 * "Read the full Local Guide" link), makes the whole section
 * location-aware: real distance/walk/drive-time on every recommendation
 * that has coordinates, and "Near Your Stay" only renders its real content
 * once this is known.
 *
 * `conciergeSources` is the raw weather/places/editorial/events data the
 * page already fetched in parallel with `fromListing`; merging it into a
 * ranked snapshot happens here, synchronously, once both have resolved.
 */
export function LocalGuide({
  destination,
  fromListing,
  conciergeSources,
  checkIn,
  checkOut,
}: {
  destination: FyldeCoastDestination;
  fromListing: OriginListing | null;
  conciergeSources: ConciergeSources;
  checkIn: Date | null;
  checkOut: Date | null;
}) {
  const guide = LOCAL_GUIDES[destination.slug];
  if (!guide) return null;

  const now = new Date();
  const snapshot = buildConciergeSnapshot(conciergeSources, fromListing);
  const rainy = snapshot.weather?.current.condition.rainy ?? false;
  const todaysEvents = eventsToday(snapshot.events, now);

  return (
    <div className="mt-14 border-t border-border-subtle pt-8">
      <div id="quick-discovery" className="scroll-mt-16">
        <QuickDiscoveryNav />
      </div>

      <blockquote className="mt-8 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <Quote className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <p className="text-sm italic leading-relaxed text-brand-900">{guide.insiderTip}</p>
      </blockquote>

      <PersonalizedGuideSection
        destinationName={destination.name}
        recommendations={snapshot.recommendations}
        rainy={rainy}
        guide={guide}
        fromListing={fromListing}
      />

      <TodayInTown
        destinationName={destination.name}
        weather={snapshot.weather}
        todaysEvents={todaysEvents}
        recommended={snapshot.recommendations}
      />

      {/* snapshot.nearby, not snapshot.recommendations: the latter is capped
          to a shared spotlight of 16, and a town with many FYSTAY_PICK
          entries (which score slightly higher than HIDDEN_GEM) can fill
          every one of those slots before a single hidden gem gets in.
          nearby is the same ranking, uncapped, so HiddenGems always finds
          every HIDDEN_GEM-tagged entry regardless of how the spotlight
          above happened to fill up. */}
      <HiddenGems destinationName={destination.name} recommendations={snapshot.nearby} />

      <PerfectDays townSlug={destination.slug} destinationName={destination.name} fromListing={fromListing} />

      <NearYourStay
        destinationName={destination.name}
        fromListing={fromListing}
        nearby={snapshot.nearby}
        guide={guide}
      />

      <WhatsOn destinationName={destination.name} events={snapshot.events} checkIn={checkIn} checkOut={checkOut} />

      <LocalKnowledge destinationName={destination.name} slug={destination.slug} fromListing={fromListing} />
    </div>
  );
}
