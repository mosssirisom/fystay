import { Skeleton } from "@/components/ui/Skeleton";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";

const SKELETON_COUNT = 6;
const MAX_STAGGER_STEPS = 5;
const STAGGER_STEP_MS = 70;

/**
 * Suspense fallback for HotelSearchResults - same shimmer/stagger pattern
 * as SearchResultsLoader (FYStay's own listing search), reusing
 * ListingCardSkeleton for the individual tiles since a hotel result card is
 * the same photo+two-line-text+price shape.
 */
export function HotelResultsLoader() {
  return (
    <div className="flex flex-col gap-5" aria-live="polite" aria-busy="true">
      <span className="sr-only">Searching hotels…</span>

      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-4" aria-hidden>
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="animate-search-caption-in font-serif text-lg italic text-stone-600">
          Checking hotel deals&hellip;
        </p>
        <div className="relative h-[3px] w-40 overflow-hidden rounded-full bg-brand-50">
          <span className="search-sweep" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="animate-search-reveal-in"
            style={{ animationDelay: `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER_STEP_MS}ms` }}
          >
            <ListingCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
