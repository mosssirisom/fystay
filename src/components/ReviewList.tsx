import { StarRating } from "@/components/ui/StarRating";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  author: { name: string };
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <>
      <hr className="my-6 border-border-subtle" />
      <div className="flex items-center gap-2">
        <StarRating rating={average} size={18} />
        <h2 className="text-lg font-semibold text-foreground">
          {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </h2>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {reviews.map((review) => (
          <li key={review.id}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{review.author.name}</p>
              <span className="text-xs text-zinc-500">
                {dateFormatter.format(review.createdAt)}
              </span>
            </div>
            <StarRating rating={review.rating} size={14} className="mt-1" />
            <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
