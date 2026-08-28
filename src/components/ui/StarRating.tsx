import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function StarRating({
  rating,
  size = 16,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i < rounded ? "fill-accent-500 text-accent-500" : "text-zinc-300"}
        />
      ))}
    </span>
  );
}
