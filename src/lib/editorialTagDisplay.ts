import type { EditorialTag } from "@prisma/client";

/** Shared display label per editorial tag, used everywhere a FYStay-curated pick shows its badge (FYStay Picks, Hidden Gems, the admin dashboard). */
export const EDITORIAL_TAG_LABEL: Record<EditorialTag, string> = {
  FYSTAY_PICK: "FYStay Pick",
  HIDDEN_GEM: "Hidden gem",
  BEST_FOR_FAMILIES: "Best for families",
  BEST_FOR_COUPLES: "Best for couples",
  BEST_CHEAP_EAT: "Best cheap eat",
  BEST_BREAKFAST: "Best breakfast",
  BEST_BEACH: "Best beach",
  BEST_WALK: "Best walk",
  BEST_RAINY_DAY: "Best for a rainy day",
};
