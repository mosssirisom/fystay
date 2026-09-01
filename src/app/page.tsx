import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock, MapPin, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SearchBar } from "@/components/SearchBar";
import { HeroBanner } from "@/components/HeroBanner";
import { FeaturedListingHero } from "@/components/FeaturedListingHero";
import { ListingsGrid } from "@/components/search/ListingsGrid";
import { ListingsCarouselSkeleton } from "@/components/ListingCardSkeleton";
import { Badge } from "@/components/ui/Badge";
import { ListingsCarousel } from "@/components/ListingsCarousel";
import { beachStaysSection, featuredListings, groupByCity, recentlyAddedSection } from "@/lib/marketplace";
import { firstName, timeOfDayGreeting } from "@/lib/greeting";

const FYLDE_COAST_AREAS = ["Blackpool", "Lytham St Annes", "Fleetwood", "Cleveleys", "Bispham"];

const TRUST_POINTS = [
  {
    icon: MapPin,
    title: "Local Fylde Coast hosts",
    description: "Every stay is listed directly by a real local host, not resold from elsewhere.",
  },
  {
    icon: Star,
    title: "Genuine guest reviews",
    description: "Reviews can only be left by guests once they've completed a paid stay.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    description: "Bookings are paid through Stripe's encrypted checkout, so we never see your card details.",
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
          before the real one has loaded. */}
      <section className="relative h-[220px] w-full overflow-hidden sm:h-[300px]">
        <Suspense fallback={<HeroBanner className="absolute inset-0 h-full w-full" />}>
          <FeaturedHero />
        </Suspense>
        <div className="absolute left-4 top-4 sm:left-8 sm:top-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)]">
            <MapPin className="h-4 w-4 text-brand-700" aria-hidden />
            Blackpool, Fylde Coast
          </span>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-8">
        {/* Pulled up over the banner's bottom edge so the search card reads
            as sitting on top of the scene, the way a native app's home
            screen often overlaps its hero photo with a content sheet. */}
        <div className="relative z-10 -mt-14 rounded-3xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-popover)] sm:-mt-20 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {greetingName
                ? `Good ${timeOfDayGreeting()}, ${greetingName}`
                : "Stay local. Book with FY Stay."}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              {greetingName
                ? "What would you like to do today?"
                : "Discover independent accommodation across Blackpool and the Fylde Coast. A local alternative to the big booking platforms."}
            </p>
          </div>
          <div className="mt-6">
            <Suspense>
              <SearchBar liveUpdate={false} />
            </Suspense>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Now covering
          </span>
          {FYLDE_COAST_AREAS.map((area) => (
            <Badge key={area} variant="neutral">
              {area}
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

        <div className="mt-14 border-t border-border-subtle pt-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Why book with FY Stay?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              A more personal, more local way to book a stay on the Fylde Coast.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
