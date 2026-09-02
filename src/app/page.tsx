import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock, MapPin, MessageCircle, Star, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SearchBar } from "@/components/SearchBar";
import { HeroBanner } from "@/components/HeroBanner";
import { FeaturedListingHero } from "@/components/FeaturedListingHero";
import { ListingsGrid } from "@/components/search/ListingsGrid";
import { ListingsCarouselSkeleton } from "@/components/ListingCardSkeleton";
import { Badge } from "@/components/ui/Badge";
import { ListingsCarousel } from "@/components/ListingsCarousel";
import { ExploreDestinations, ExploreDestinationsSkeleton } from "@/components/ExploreDestinations";
import { beachStaysSection, featuredListings, groupByCity, recentlyAddedSection } from "@/lib/marketplace";
import { firstName, timeOfDayGreeting } from "@/lib/greeting";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";

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

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
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
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const featured = featuredListings(featuredListingsData);

  if (featured.length === 0) return <HeroBanner className="absolute inset-0 h-full w-full" />;
  return <FeaturedListingHero listings={featured} className="absolute inset-0 h-full w-full" />;
}

export default async function Home() {
  const session = await auth();
  const greetingName = session?.user?.name ? firstName(session.user.name) : null;

  return (
    <>
      {/* Full-bleed backdrop, deliberately outside the max-w-6xl content
          container below so it spans the entire viewport width. Falls back
          to the generated illustration only when there's nothing real to
          feature yet (a brand-new, empty catalog), or for the brief moment
          before the real one has loaded. Tall enough to carry a real
          marketing headline over the photo, not just a caption strip. */}
      <section className="relative h-[420px] w-full overflow-hidden sm:h-[500px] lg:h-[580px]">
        <Suspense fallback={<HeroBanner className="absolute inset-0 h-full w-full" />}>
          <FeaturedHero />
        </Suspense>

        {/* Brand vignette over the photo/illustration - teal-tinted rather
            than a flat black scrim, so the hero reads as distinctly FYstay
            before a single word of text renders. Darker at the top (for the
            headline) and bottom (for the featured-listing caption and the
            search card's edge), lighter through the middle so the photo
            still shows through. z-10: explicit, so it reliably paints above
            the backdrop (FeaturedHero/HeroBanner, unpositioned) but below
            the hero's own text layers (z-20+ - see FeaturedListingHero for
            why an explicit z is needed there too). */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-b from-brand-950/75 via-brand-950/15 to-brand-950/80"
          aria-hidden
        />

        <div className="absolute inset-x-4 top-20 z-30 max-w-xl sm:inset-x-8 sm:top-28 lg:top-32">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-400 sm:text-sm">
            {greetingName ? "Welcome back" : "Fylde Coast accommodation, booked direct"}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white [text-shadow:0_2px_20px_rgb(0_0_0_/_0.35)] sm:text-5xl lg:text-6xl">
            {greetingName ? `Good ${timeOfDayGreeting()}, ${greetingName}` : "Stay local. Stay Fylde Coast."}
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base">
            {greetingName
              ? "What would you like to do today?"
              : "Independent apartments, cottages and guest houses from real local hosts — no resellers, just the coast."}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-8">
        {/* Pulled up over the banner's bottom edge so the search card reads
            as sitting on top of the scene, the way a native app's home
            screen often overlaps its hero photo with a content sheet. The
            headline/subtext now live on the hero image itself (see the
            <section> above) so this card can stay focused on the one thing
            it needs to convert: the search bar. The gradient strip along
            the top is a small signature touch - most booking sites don't
            do it - to keep the card feeling distinctly FYstay rather than a
            plain white panel. */}
        <div className="relative z-10 -mt-14 overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-[var(--shadow-popover)] sm:-mt-20">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-accent-400" aria-hidden />
          <div className="p-5 sm:p-8">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-400 sm:text-left">
              Search stays on the Fylde Coast
            </p>
            <div className="mt-3">
              <Suspense>
                <SearchBar liveUpdate={false} />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
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
            Every FYstay town, one tap away from its own local stays.
          </p>
          <div className="mt-6">
            <Suspense fallback={<ExploreDestinationsSkeleton />}>
              <ExploreDestinations />
            </Suspense>
          </div>
        </div>

        <div className="mt-14 border-t border-border-subtle pt-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Why FYstay?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              FYstay is built around one coastline, not spread thin across the world - everything
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
      </div>
    </>
  );
}
