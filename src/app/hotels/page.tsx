import { Suspense } from "react";
import type { Metadata } from "next";
import { HotelSearchForm } from "@/components/hotels/HotelSearchForm";
import { HotelSearchResults } from "@/components/hotels/HotelSearchResults";
import { HotelResultsLoader } from "@/components/hotels/HotelResultsLoader";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Hotel search",
  description: "Compare hotel deals from our booking partners across any destination.",
  // Every combination of destination/dates/guests renders from the same URL
  // shape, none of it worth indexing separately - same call FYStay's own
  // /search page's metadata already makes.
  robots: { index: false, follow: true },
};

/**
 * The hotel-affiliate search page - FYStay's own equivalent of /search, but
 * for third-party hotel inventory (see src/lib/hotelProviders/ for the
 * whole system's own top comments on why this is deliberately a separate
 * page/route from /search and /listings). Search results here always link
 * out to a booking partner via /hotels/[destination]/[hotelSlug]; FYStay
 * itself never takes a hotel booking or payment through this page.
 */
export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Suspense>
        <HotelSearchForm />
      </Suspense>

      <div className="mt-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Hotel deals</h1>
        <p className="mt-1 text-sm text-stone-500">
          Compare hotels from our booking partners and book directly with them.
        </p>
        <div className="mt-6">
          <Suspense fallback={<HotelResultsLoader />}>
            <HotelSearchResults searchParams={resolvedSearchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
