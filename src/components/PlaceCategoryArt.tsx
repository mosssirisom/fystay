import type { LocalPlaceCategory } from "@prisma/client";
import { PLACE_CATEGORY_GRADIENT, PLACE_CATEGORY_ICON } from "@/lib/placeCategoryDisplay";
import { cn } from "@/lib/cn";

/**
 * A generated category tile standing in for a place's photo - the same
 * "gradient + line-art icon" language as prisma/seed.ts's listing
 * placeholders and TownHeroArt.tsx's hero scenes, for exactly the same
 * reason: FYStay has no real, licensed photography for these places, and a
 * hotlinked stock photo of "a restaurant" would misrepresent a specific
 * one. Distinct per category so a row of cards still reads as varied.
 */
export function PlaceCategoryArt({ category, className }: { category: LocalPlaceCategory; className?: string }) {
  const [from, to] = PLACE_CATEGORY_GRADIENT[category];
  const Icon = PLACE_CATEGORY_ICON[category];
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <Icon className="h-10 w-10 text-white/70" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
