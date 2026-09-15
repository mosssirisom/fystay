import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Home as HomeIcon, Lock, MapPin, MessageCircle, Star, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SearchBar } from "@/components/SearchBar";
import { HeroBanner } from "@/components/HeroBanner";
import { ListingsGrid } from "@/components/search/ListingsGrid";
import { ListingsCarouselSkeleton } from "@/components/ListingCardSkeleton";
import { buttonVariants } from "@/components/ui/Button";
import { ListingsCarousel } from "@/components/ListingsCarousel";
import {
  DESTINATION_ART,
  ExploreDestinations,
  ExploreDestinationsSkeleton,
} from "@/components/ExploreDestinations";
import { TripTypeCategories } from "@/components/TripTypeCategories";
import { AirportTransferPromo } from "@/components/AirportTransferPromo";
import { Reveal } from "@/components/Reveal";
import { beachStaysSection, groupByCity, recentlyAddedSection } from "@/lib/marketplace";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/seo";
import { cn } from "@/lib/cn";

const TRUST_POINTS = [
  {
    icon: Users,
    title: "Local hosts, not a franchise",
    description:
      "Every stay is listed and managed by an individual host based on the Fylde Coast - never a resold listing or an absent management company.",
  },
  {
    icon: MapPin,
    title: "Genuinely local properties",
    description:
      "Apartments, cottages and guest houses across Blackpool, Lytham St Annes, Fleetwood, Cleveleys and Bispham - real places on this coast, not imported inventory.",
  },
  {
    icon: MessageCircle,
    title: "Direct access to your host",
    description:
      "Once you've booked, your host's contact details are right there on your booking - no call centre standing between you and the person who actually knows the place.",
  },
  {
    icon: Star,
    title: "Genuine guest reviews",
    description: "Only a guest who's completed a paid stay can leave a review, so every rating reflects a real stay.",
  },
  {
    icon: Lock,
    title: "Secure, transparent booking",
    description: "Payments run through Stripe's encrypted checkout with the full price shown upfront - we never see your card details.",
  },
];

const title = "Local Accommodation in Blackpool & the Fylde Coast";
const description =
  "Search and book independent apartments, cottages and guest houses across Blackpool and the Fylde Coast. Real local hosts, genuine reviews, secure booking.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: SITE_URL },
  openGraph: { title, description, url: SITE_URL, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Browse-by-category rows shown only on the homepage - a search instead
 * takes the visitor to the dedicated /search results page, so there's no
 * "active search" state to reconcile these against here any more.
 */
async function MarketplaceSections() {
  const [session, listings] = await Promise.all([
    auth(),
    prisma.listing.findMany({
      where: { published: true },
      include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const savedListingIds = session?.user
    ? new Set(
        (
          await prisma.savedListing.findMany({
            where: { userId: session.user.id },
            select: { listingId: true },
          })
        ).map((s) => s.listingId),
      )
    : new Set<string>();

  const sections = [
    ...groupByCity(listings),
    beachStaysSection(listings),
    recentlyAddedSection(listings),
  ].filter((section) => section !== null);

  if (sections.length === 0) return null;

  return (
    <div className="mt-14 flex flex-col gap-12">
      {sections.map((section) => (
        <div key={section.key}>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
          <p className="mt-1 text-sm text-stone-500">{section.subtitle}</p>
          <div className="mt-6">
            <ListingsCarousel
              listings={section.listings}
              savedListingIds={savedListingIds}
              isLoggedIn={Boolean(session?.user)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  // WebSite + SearchAction tells Google this site has an internal search it
  // can offer directly in results (a "sitelinks search box"), targeting the
  // real /search?city= URL the homepage's own search bar already uses -
  // not a hypothetical endpoint. Organization's areaServed is the same
  // named-town list as the "Now covering" badges and the Explore section
  // below, so this only ever states places FYStay actually covers.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/search?city={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/apple-icon`,
        description,
        areaServed: FYLDE_COAST_DESTINATIONS.map((destination) => ({
          "@type": "Place",
          name: destination.name,
        })),
        contactPoint: {
          "@type": "ContactPoint",
          email: SUPPORT_EMAIL,
          contactType: "customer support",
          areaServed: "GB",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* Full-bleed backdrop, deliberately outside the max-w-6xl content
          container so it spans the entire viewport width. Purely a video
          moment - no rotating real-listing photo or caption here (that's
          what the search results and destination pages are for), so
          nothing on this section depends on the catalog having listings
          in it. */}
      <section className="relative mt-6 h-[420px] w-full overflow-hidden sm:mt-8 sm:h-[500px] lg:h-[580px]">
        <HeroBanner className="absolute inset-0 h-full w-full" />

        {/* Scrim over the video - darkens only the sky band (behind the
            headline) and the sand band (behind the search bar), left
            fully clear through the middle third on purpose so the Tower,
            pier and beach read at full strength. */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(12,9,7,0.5)_0%,rgba(12,9,7,0)_28%,rgba(12,9,7,0)_64%,rgba(12,9,7,0.55)_100%)]" />

        {/* The headline: one line, up in the open sky at the top of the
            frame - not a left-aligned block over the water, and not a
            multi-line pitch. The eyebrow label and descriptive line that
            used to sit here now live below the fold entirely (see the
            strip right after this section), off the footage. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-6 pt-7 sm:pt-9">
          <h1 className="max-w-[15ch] text-balance text-center font-[family-name:var(--font-serif)] text-[1.85rem] font-normal leading-[1.1] text-white sm:text-4xl lg:text-5xl">
            Your stay starts <em className="italic">here.</em>
          </h1>
        </div>

        {/* The search bar floats low over the video - close to the bottom
            edge, but with margin on every side (this wrapper's own
            bottom offset and horizontal padding) so no corner of the
            card ever touches the video's own frame - rather than the
            earlier full-bleed band this replaced. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-4 sm:bottom-4">
          {/* w-full max-w-4xl (not just letting the flex item shrink-wrap
              its content) so the bar actually grows to fill the width
              this row allows, rather than only ever rendering as wide as
              its fields' own natural size. */}
          <div className="pointer-events-auto w-full max-w-4xl">
            <Suspense>
              <SearchBar liveUpdate={false} variant="hero" />
            </Suspense>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-8">
        {/* The line that used to sit on the video, now back on the page's
            own background directly below the search bar - a hero is just
            the one line up top, this is where the rest of the pitch goes. */}
        <p className="mx-auto max-w-lg pt-6 text-center text-sm text-stone-600 sm:pt-8 sm:text-base">
          Local stays, chosen with care. Local knowledge, on arrival. Door-to-door transfers, sorted before you land.
        </p>
        {/* A horizontally-scrollable strip on mobile (edge-fade masks, not
            clipped arrows) rather than the wrapped-badge row this replaces -
            reads more like an app's own category rail, and each pill now
            carries the same per-town icon/gradient motif as the "Explore"
            tiles below, so a visitor sees the same visual language for a
            town twice, not two unrelated treatments of the same five names. */}
        <div className="relative mt-8">
          <div
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:px-0 sm:[mask-image:none] [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)] [&::-webkit-scrollbar]:hidden"
          >
            <span className="flex shrink-0 snap-start items-center text-xs font-semibold uppercase tracking-wide text-stone-500">
              Now covering
            </span>
            {FYLDE_COAST_DESTINATIONS.map((destination) => {
              const art = DESTINATION_ART[destination.slug];
              const Icon = art?.icon;
              return (
                <Link
                  key={destination.slug}
                  href={`/search?city=${encodeURIComponent(destination.searchCity)}`}
                  className={cn(
                    "focus-ring flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-stone-700 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-800 hover:shadow-[var(--shadow-card-hover)]",
                  )}
                >
                  {Icon && (
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white",
                        art.gradient,
                      )}
                    >
                      <Icon className="h-3 w-3" aria-hidden />
                    </span>
                  )}
                  {destination.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Hand-picked stays</h2>
          <p className="mt-1 text-sm text-stone-500">
            Hand-picked local places to stay, ready to book today.
          </p>
          <div className="mt-6">
            <Suspense fallback={<ListingsCarouselSkeleton />}>
              <ListingsGrid searchParams={{}} showResultsView={false} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={null}>
          <AirportTransferPromo />
        </Suspense>

        <div className="mt-14">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Find your perfect stay</h2>
          <p className="mt-1 text-sm text-stone-500">
            Browse by what you&apos;re after, not just where you&apos;re going.
          </p>
          <div className="mt-6">
            <TripTypeCategories />
          </div>
        </div>

        <Suspense fallback={null}>
          <MarketplaceSections />
        </Suspense>

        {/* A geographic index rather than another listings carousel - each
            tile is a real, working link to that town's search results
            today, and doubles as the seed for dedicated per-destination
            landing pages later (see lib/destinations.ts). */}
        <Reveal className="mt-14">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Explore the Fylde Coast</h2>
          <p className="mt-1 text-sm text-stone-500">
            Every FYStay town, one tap away from its own local stays.
          </p>
          <div className="mt-6">
            <Suspense fallback={<ExploreDestinationsSkeleton />}>
              <ExploreDestinations />
            </Suspense>
          </div>
        </Reveal>

        <Reveal className="mt-14 border-t border-border-subtle pt-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Why FYStay?</h2>
            <p className="mt-1 text-sm text-stone-500">
              FYStay is built around one coastline, not spread thin across the world - everything
              here is designed for booking a stay on the Fylde Coast, and nowhere else.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The one host-facing moment on an otherwise guest-facing homepage -
            a distinct gradient card (same signature-strip idea as the search
            card above) so it reads as a deliberate second front door, not an
            afterthought link buried in the footer. Routes to /host, which
            makes its own role-aware call on where "List your property"
            should actually go (sign-up vs. straight to a new listing for an
            existing host). */}
        <Reveal className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 shadow-[var(--shadow-popover)]">
          <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
            <div className="flex items-start gap-4">
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white sm:flex">
                <HomeIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  Own a place on the Fylde Coast?
                </h2>
                <p className="mt-1 max-w-md text-sm text-white/80">
                  List it on FYStay: local exposure, a local customer base, and one simple
                  dashboard to manage it all.
                </p>
                <Suspense fallback={null}>
                  <LiveStayCount />
                </Suspense>
              </div>
            </div>
            <Link
              href="/host"
              className={cn(buttonVariants({ size: "lg" }), "shrink-0 bg-white text-brand-800 hover:bg-white/90")}
            >
              List your property
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}

/**
 * A single honest fact ("N stays live today") rather than any invented
 * urgency or growth claim - only rendered once there's at least one real
 * stay to count, so an empty catalog never states "0 stays live" as if
 * that were a selling point. Its own query (not threaded down from
 * MarketplaceSections above) since a plain count is cheap and
 * this is the one place on the page that needs exactly that number.
 */
async function LiveStayCount() {
  const count = await prisma.listing.count({ where: { published: true } });
  if (count === 0) return null;

  return (
    <p className="mt-3 text-xs font-medium text-white/70">
      {count} stay{count === 1 ? "" : "s"} already live across the Fylde Coast
    </p>
  );
}
