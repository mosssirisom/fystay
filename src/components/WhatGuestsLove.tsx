import { Heart } from "lucide-react";
import { REVIEW_CATEGORIES, REVIEW_CATEGORY_LABEL, type RatingBreakdown } from "@/lib/reviews";

// A category only counts as something guests "love" once it's both rated
// highly and rated by enough people that one enthusiastic review can't
// carry it alone.
const MIN_AVERAGE = 4.5;
const MIN_RATINGS_COUNTED = 2;
const MAX_SHOWN = 3;

/**
 * A short, genuine list built only from real per-category review averages
 * (see computeRatingBreakdown) - never present when there aren't enough
 * reviews to say anything real, and never phrased as a quote or a claim
 * beyond "this category rates highly", which is exactly what the number
 * behind it means.
 */
export function WhatGuestsLove({
  categoryAverages,
  reviewCount,
}: {
  categoryAverages: RatingBreakdown["categoryAverages"];
  reviewCount: number;
}) {
  if (reviewCount < MIN_RATINGS_COUNTED) return null;

  const standoutCategories = REVIEW_CATEGORIES.filter(
    (category) => (categoryAverages[category] ?? 0) >= MIN_AVERAGE,
  ).slice(0, MAX_SHOWN);

  if (standoutCategories.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl bg-surface-muted p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Heart className="h-4 w-4 shrink-0 fill-brand-600 text-brand-600" aria-hidden />
        What guests love
      </p>
      <ul className="flex flex-wrap gap-2">
        {standoutCategories.map((category) => (
          <li
            key={category}
            className="rounded-full bg-surface px-3 py-1 text-sm text-stone-700 shadow-[var(--shadow-card)]"
          >
            {REVIEW_CATEGORY_LABEL[category]} · {(categoryAverages[category] as number).toFixed(1)}
          </li>
        ))}
      </ul>
    </div>
  );
}
