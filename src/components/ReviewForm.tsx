"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { REVIEW_CATEGORIES, type ReviewCategory } from "@/lib/reviews";
import { cn } from "@/lib/cn";

const CATEGORY_LABEL: Record<ReviewCategory, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  communication: "Communication",
  location: "Location",
  value: "Value",
};

function StarPicker({
  value,
  onChange,
  size = "h-7 w-7",
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: string;
  label: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus-ring rounded p-0.5"
        >
          <Star
            className={cn(
              size,
              (hover || value) >= star ? "fill-accent-500 text-accent-500" : "text-zinc-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

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
  const [comment, setComment] = useState("");
  const [categoryRatings, setCategoryRatings] = useState<Partial<Record<ReviewCategory, number>>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  function setCategoryRating(category: ReviewCategory, value: number) {
    setCategoryRatings((prev) => ({ ...prev, [category]: value }));
  }

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
      body: JSON.stringify({
        bookingId,
        rating,
        comment,
        cleanlinessRating: categoryRatings.cleanliness,
        accuracyRating: categoryRatings.accuracy,
        communicationRating: categoryRatings.communication,
        locationRating: categoryRatings.location,
        valueRating: categoryRatings.value,
      }),
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
          <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">Overall rating</p>
            <StarPicker value={rating} onChange={setRating} label="Overall rating" />
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
            <p className="text-xs font-semibold text-foreground">Rate specific aspects (optional)</p>
            {REVIEW_CATEGORIES.map((category) => (
              <div key={category} className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-600">{CATEGORY_LABEL[category]}</span>
                <StarPicker
                  value={categoryRatings[category] ?? 0}
                  onChange={(value) => setCategoryRating(category, value)}
                  size="h-4.5 w-4.5"
                  label={CATEGORY_LABEL[category]}
                />
              </div>
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
