import { StarRating } from "@/components/ui/StarRating";
import { computeRatingBreakdown, REVIEW_CATEGORIES, type RatableReview } from "@/lib/reviews";

const CATEGORY_LABEL: Record<string, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  communication: "Communication",
  location: "Location",
  value: "Value",
};

export function ReviewSummary({ reviews }: { reviews: RatableReview[] }) {
  const { count, average, starCounts, categoryAverages } = computeRatingBreakdown(reviews);
  if (count === 0 || average === null) return null;

  const activeCategories = REVIEW_CATEGORIES.filter((category) => categoryAverages[category] !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <StarRating rating={average} size={22} />
        <div>
          <p className="text-xl font-semibold leading-tight text-foreground">
            {average.toFixed(1)} <span aria-hidden>★</span>
          </p>
          <p className="text-sm text-zinc-500">
            {count} review{count === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex max-w-xs flex-col gap-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const starCount = starCounts[star];
          const pct = count > 0 ? (starCount / count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-3 text-right">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right">{starCount}</span>
            </div>
          );
        })}
      </div>

      {activeCategories.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          {activeCategories.map((category) => {
            const value = categoryAverages[category] as number;
            return (
              <div key={category}>
                <dt className="text-sm text-zinc-500">{CATEGORY_LABEL[category]}</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="w-6">{value.toFixed(1)}</span>
                  <span className="h-1 w-16 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="block h-full rounded-full bg-foreground/60"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
