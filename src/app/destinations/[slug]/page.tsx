import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListingsGrid } from "@/components/search/ListingsGrid";
import { ListingsGridSkeleton } from "@/components/ListingCardSkeleton";
import { LocalGuide } from "@/components/LocalGuide";
import { FYLDE_COAST_DESTINATIONS, type FyldeCoastDestination } from "@/lib/destinations";
import { LOCAL_GUIDES } from "@/lib/localGuide";
import { pageMetadata, SITE_URL } from "@/lib/seo";

/**
 * Looks up the listing a guest arrived from (via the "Read the full X Local
 * Guide" link on a listing page, which appends ?from=<listingId>) so the
 * guide below can show real distances from that specific property rather
 * than nothing. A fresh, authoritative lookup rather than trusting raw
 * coordinates in the URL - a stale or tampered `from` value just falls
 * back to the guide's default, non-location-aware behaviour.
 */
async function findOriginListing(listingId: string | undefined) {
  if (!listingId) return null;
  const listing = await prisma.listing
    .findUnique({
      where: { id: listingId, published: true },
      select: { title: true, latitude: true, longitude: true },
    })
    .catch(() => null);
  if (!listing || listing.latitude === null || listing.longitude === null) return null;
  return { title: listing.title, latitude: listing.latitude, longitude: listing.longitude };
}

type SearchParams = Record<string, string | string[] | undefined>;

function findDestination(slug: string): FyldeCoastDestination | undefined {
  return FYLDE_COAST_DESTINATIONS.find((destination) => destination.slug === slug);
}

// One real, indexable page per town instead of everything funnelling
// through the noindexed /search?city= results page - the exact gap
// destinations.ts was written to fill (see its doc comment), so a search
// for "accommodation in Blackpool" has a dedicated, crawlable URL to rank
// rather than a filtered view of the homepage's own listings.
export function generateStaticParams() {
  return FYLDE_COAST_DESTINATIONS.map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = findDestination(slug);
  if (!destination) return {};

  const title = `Accommodation in ${destination.name}, Fylde Coast`;
  const description = `${destination.description} Browse independent apartments, cottages and guest houses in ${destination.name} with genuine reviews and secure booking on FYStay.`;

  return pageMetadata({ title, description, path: `/destinations/${destination.slug}` });
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const destination = findDestination(slug);
  if (!destination) notFound();

  const fromParam = resolvedSearchParams.from;
  const fromListing = await findOriginListing(typeof fromParam === "string" ? fromParam : undefined);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: destination.name,
        item: `${SITE_URL}/destinations/${destination.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-brand-700 hover:underline">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{destination.name}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
        Accommodation in {destination.name}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{destination.description}</p>

      {LOCAL_GUIDES[destination.slug] && (
        <a
          href="#local-guide"
          className="focus-ring mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Jump to the {destination.name} Local Guide
        </a>
      )}

      <div className="mt-6">
        <Suspense fallback={<ListingsGridSkeleton />}>
          <ListingsGrid
            searchParams={{ ...resolvedSearchParams, city: destination.searchCity }}
            showResultsView
          />
        </Suspense>
      </div>

      <LocalGuide destination={destination} fromListing={fromListing} />
    </div>
  );
}
