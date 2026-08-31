import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchBar } from "@/components/SearchBar";
import { ListingsGrid } from "@/components/search/ListingsGrid";
import { ListingsGridSkeleton } from "@/components/ListingCardSkeleton";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Search results",
  // Every combination of filters/sort/dates renders from the same URL
  // shape, none of it worth indexing separately from the homepage.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Suspense>
        <SearchBar />
      </Suspense>

      <div className="mt-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Search results</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Refine with filters and sorting to find exactly what you&apos;re after.
        </p>
        <div className="mt-6">
          <Suspense fallback={<ListingsGridSkeleton />}>
            <ListingsGrid searchParams={resolvedSearchParams} showResultsView />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
