"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";

export function ReviewForm({
  bookingId,
  listingTitle,
}: {
  bookingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Choose a star rating.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rating, comment }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not submit review.");
      return;
    }

    toast.success("Review submitted");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Leave a review
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`Review ${listingTitle}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Rating" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus-ring rounded p-0.5"
              >
                <Star
                  className={cn(
                    "h-7 w-7",
                    (hoverRating || rating) >= star
                      ? "fill-accent-500 text-accent-500"
                      : "text-zinc-300",
                  )}
                />
              </button>
            ))}
          </div>

          <Textarea
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            placeholder="How was your stay?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <Button type="submit" loading={loading} className="self-end">
            Submit review
          </Button>
        </form>
      </Dialog>
    </>
  );
}
