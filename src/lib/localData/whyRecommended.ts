import type { EditorialTag } from "@prisma/client";
import type { LocalRecommendation } from "@/lib/localData/recommendationEngine";

const WHY_BY_TAG: Record<EditorialTag, string> = {
  FYSTAY_PICK: "A FYStay favourite - the kind of place we send our own guests to.",
  HIDDEN_GEM: "Loved by locals, missed by most visitors who never look past the obvious spots.",
  BEST_FOR_FAMILIES: "Genuinely easy with kids in tow, not just tolerant of them.",
  BEST_FOR_COUPLES: "A proper option for two, worth the short trip.",
  BEST_CHEAP_EAT: "Real value without cutting corners on quality.",
  BEST_BREAKFAST: "Our pick for starting the day right.",
  BEST_BEACH: "One of this coast's best stretches of sand.",
  BEST_WALK: "A route worth going out of your way for.",
  BEST_RAINY_DAY: "Reliable when the weather turns - warm, dry and worth the visit anyway.",
};

/**
 * A short, honest "why FYStay recommends it" line. Editorial picks get the
 * reason their tag already asserts; a plain OSM-sourced place with no
 * editorial judgement yet falls back to whichever real signal it actually
 * has (distance, then rating) rather than a tag-shaped claim nobody wrote.
 */
export function describeWhyRecommended(rec: Pick<LocalRecommendation, "editorialTag" | "distanceMiles" | "rating">): string {
  if (rec.editorialTag) return WHY_BY_TAG[rec.editorialTag];
  if (rec.rating !== null && rec.rating >= 4) return "Consistently well-rated by people who've actually been.";
  if (rec.distanceMiles !== null && rec.distanceMiles <= 0.5) return "Right on your doorstep for this stay.";
  return "A well-placed local spot worth knowing about.";
}
