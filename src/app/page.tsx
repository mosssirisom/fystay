import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Home as HomeIcon, Lock, MapPin, MessageCircle, Star, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SearchBar } from "@/components/SearchBar";
import { HeroBanner } from "@/components/HeroBanner";
import { FeaturedListingHero } from "@/components/FeaturedListingHero";
import { ListingsGrid } from "@/components/search/ListingsGrid";
import { ListingsCarouselSkeleton } from "@/components/ListingCardSkeleton";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { ListingsCarousel } from "@/components/ListingsCarousel";
import { ExploreDestinations, ExploreDestinationsSkeleton } from "@/components/ExploreDestinations";
import { beachStaysSection, featuredListings, groupByCity, recentlyAddedSection } from "@/lib/marketplace";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
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
      include: { reviews: { select: { rating: true } } },
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
          <p className="mt-1 text-sm text-zinc-500">{section.subtitle}</p>
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

/**
 * The rotating hero spotlight, split out behind its own Suspense boundary
 * (fallback: the plain generated illustration) rather than awaited inline
 * in Home() - an early version awaited this query directly, which blocks
 * the entire page's initial HTML (SearchBar included) on a DB round trip
 * for no real benefit, the same reasoning MarketplaceSections already
 * follows below. Not, on its own, a fix for hydration-timing flakiness
 * elsewhere on the page (see the comment on search-bar-dates.spec.ts for
 * the real story there) - just not adding to it.
 */
async function FeaturedHero() {
  const featuredListingsData = await prisma.listing.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      pricePerNightCents: true,
      photos: true,
      amenities: true,
      maxGuests: true,
      bedrooms: true,
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const featured = featuredListings(featuredListingsData);

  if (featured.length === 0) return <HeroBanner className="absolute inset-0 h-full w-full" />;
  return <FeaturedListingHero listings={featured} className="absolute inset-0 h-full w-full" />;
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
        areaServed: FYLDE_COAST_DESTINATIONS.map((destination) => ({
          "@type": "Place",
          name: destination.name,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* A contained, rounded photo card (like every other card on this
          page) rather than a full-bleed banner touching the viewport's
          edges - the rounded corners clip the featured listing's own
          bottom caption strip too, via the overflow-hidden on the same
          element, so the strip's bottom corners match the photo's rather
          than sitting square against a rounded frame. Falls back to the
          generated illustration only when there's nothing real to feature
          yet (a brand-new, empty catalog), or for the brief moment before
          the real one has loaded. Carries no marketing headline of its own
          - just the photo and its own featured-listing caption (see
          FeaturedListingHero), so nothing competes with the photo for
          attention. */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <section className="relative h-[380px] w-full overflow-hidden rounded-3xl sm:h-[460px] lg:h-[520px]">
          <Suspense fallback={<HeroBanner className="absolute inset-0 h-full w-full" />}>
            <FeaturedHero />
          </Suspense>
        </section>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-8">
        {/* Sits just below the hero photo instead of overlapping it - an
            overlapping version was tried, but that always hid a slice of
            whatever was behind it (the photo, and now the featured
            listing's own bottom strip), however small. SearchBar already
            carries its own premium styling (rounded pill on sm+, its own
            border and shadow - see SearchBar.tsx), so it doesn't need a
            second card wrapped around it here. */}
        <div className="mt-6 sm:mt-8">
          <Suspense>
            <SearchBar liveUpdate={false} />
          </Suspense>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Now covering
          </span>
          {FYLDE_COAST_DESTINATIONS.map((destination) => (
            <Badge key={destination.slug} variant="neutral">
              {destination.name}
            </Badge>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Popular stays on the Fylde Coast
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Hand-picked local places to stay, ready to book today.
          </p>
          <div className="mt-6">
            <Suspense fallback={<ListingsCarouselSkeleton />}>
              <ListingsGrid searchParams={{}} showResultsView={false} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={null}>
          <MarketplaceSections />
        </Suspense>

        {/* A geographic index rather than another listings carousel - each
            tile is a real, working link to that town's search results
            today, and doubles as the seed for dedicated per-destination
            landing pages later (see lib/destinations.ts). */}
        <div className="mt-14">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Explore the Fylde Coast</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every FYStay town, one tap away from its own local stays.
          </p>
          <div className="mt-6">
            <Suspense fallback={<ExploreDestinationsSkeleton />}>
              <ExploreDestinations />
            </Suspense>
          </div>
        </div>

        <div className="mt-14 border-t border-border-subtle pt-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Why FYStay?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              FYStay is built around one coastline, not spread thin across the world - everything
              here is designed for booking a stay on the Fylde Coast, and nowhere else.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The one host-facing moment on an otherwise guest-facing homepage -
            a distinct gradient card (same signature-strip idea as the search
            card above) so it reads as a deliberate second front door, not an
            afterthought link buried in the footer. Routes to /host, which
            makes its own role-aware call on where "List your property"
            should actually go (sign-up vs. straight to a new listing for an
            existing host). */}
        <div className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 shadow-[var(--shadow-popover)]">
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
              </div>
            </div>
            <Link
              href="/host"
              className={cn(buttonVariants({ size: "lg" }), "shrink-0 bg-white text-brand-800 hover:bg-white/90")}
            >
              List your property
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
