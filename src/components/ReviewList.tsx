import { BadgeCheck } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { ReportReviewButton } from "@/components/ReportReviewButton";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  author: { id: string; name: string };
  hostResponse: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function ReviewList({
  reviews,
  hostName,
  viewerId,
  reportedReviewIds,
}: {
  reviews: Review[];
  hostName: string;
  /** Omit when logged out - reporting requires an account. */
  viewerId?: string;
  reportedReviewIds: Set<string>;
}) {
  if (reviews.length === 0) return null;

  return (
    <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
      {reviews.map((review) => (
        <li key={review.id} className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{firstName(review.author.name)}</p>
              <span className="text-xs text-zinc-500">{dateFormatter.format(review.createdAt)}</span>
            </div>
            {viewerId && viewerId !== review.author.id && (
              <ReportReviewButton
                reviewId={review.id}
                alreadyReported={reportedReviewIds.has(review.id)}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} size={14} />
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified stay
            </span>
          </div>

          <p className="text-sm text-zinc-700">{review.comment}</p>

          {review.hostResponse && (
            <div className="mt-1 rounded-lg bg-surface-muted p-3 text-sm">
              <p className="font-medium text-foreground">Response from {hostName}</p>
              <p className="mt-1 text-zinc-600">{review.hostResponse}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
