"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { AmenityList } from "@/components/AmenityList";

// Enough to fill the two-column grid to a natural-looking row count without
// the section towering over "About this stay" above it - matches the
// "show the first 6-8" guidance from major booking platforms.
const VISIBLE_COUNT = 8;

/**
 * The listing page's amenities grid: the first VISIBLE_COUNT items, then a
 * "Show all" button into the full list once there are more than that -
 * never more than one screenful of icons before a guest has to make a
 * choice to see more.
 */
export function AmenitiesSection({ amenities }: { amenities: string[] }) {
  const [showAll, setShowAll] = useState(false);
  if (amenities.length === 0) return null;

  const visible = amenities.slice(0, VISIBLE_COUNT);
  const remaining = amenities.length - visible.length;

  return (
    <>
      <AmenityList amenities={visible} />
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="focus-ring mt-5 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
        >
          Show all {amenities.length} amenities →
        </button>
      )}

      <Dialog
        open={showAll}
        onClose={() => setShowAll(false)}
        title="What this place offers"
        className="sm:max-w-lg"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <AmenityList amenities={amenities} />
        </div>
      </Dialog>
    </>
  );
}
