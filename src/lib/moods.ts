import {
  Baby,
  Beer,
  CloudRain,
  Heart,
  PawPrint,
  ShoppingBag,
  Sun,
  UtensilsCrossed,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { GUIDE_CATEGORIES, type GuideCategoryKey, type GuideEntry, type TownGuide } from "@/lib/localGuide";

export type MoodKey =
  | "family"
  | "couples"
  | "foodAndDrink"
  | "beachDay"
  | "rainyDay"
  | "nightOut"
  | "relaxing"
  | "dogFriendly"
  | "shopping"
  | "kids";

export const MOODS: { key: MoodKey; label: string; icon: LucideIcon }[] = [
  { key: "family", label: "Family", icon: Users },
  { key: "couples", label: "Couples", icon: Heart },
  { key: "foodAndDrink", label: "Food & drink", icon: UtensilsCrossed },
  { key: "beachDay", label: "Beach day", icon: Waves },
  { key: "rainyDay", label: "Rainy day", icon: CloudRain },
  { key: "nightOut", label: "Night out", icon: Beer },
  { key: "relaxing", label: "Relaxing", icon: Sun },
  { key: "dogFriendly", label: "Dog friendly", icon: PawPrint },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
  { key: "kids", label: "Things to do with kids", icon: Baby },
];

/**
 * Which guide categories matter most for each "what are you looking for"
 * pick, most relevant first. Deliberately reuses the guide content that
 * already exists per town (see localGuide.ts) rather than needing separate
 * per-mood, per-town copy - selecting a mood re-sorts and highlights the
 * same 14 categories every guide already has, so this scales to a new town
 * for free the moment it gets a TownGuide entry.
 */
export const MOOD_CATEGORY_PRIORITY: Record<MoodKey, GuideCategoryKey[]> = {
  family: ["family", "beachesAndWalks", "thingsToDo", "rainyDay", "events"],
  couples: ["eat", "hiddenGems", "beachesAndWalks", "coffeeAndBreakfast", "pubsAndNightlife"],
  foodAndDrink: ["eat", "coffeeAndBreakfast", "pubsAndNightlife"],
  beachDay: ["beachesAndWalks", "dogFriendly", "coffeeAndBreakfast", "family"],
  rainyDay: ["rainyDay", "shopping", "coffeeAndBreakfast", "eat"],
  nightOut: ["pubsAndNightlife", "eat", "events"],
  relaxing: ["beachesAndWalks", "coffeeAndBreakfast", "hiddenGems", "amenities"],
  dogFriendly: ["dogFriendly", "beachesAndWalks", "eat", "coffeeAndBreakfast"],
  shopping: ["shopping", "coffeeAndBreakfast", "eat"],
  kids: ["family", "thingsToDo", "beachesAndWalks", "rainyDay", "events"],
};

const CATEGORY_LABEL: Record<GuideCategoryKey, string> = Object.fromEntries(
  GUIDE_CATEGORIES.map((category) => [category.key, category.label]),
) as Record<GuideCategoryKey, string>;

/**
 * Reorders the full 14-category list so a mood's priority categories lead,
 * in priority order, followed by every remaining category in its original
 * order - nothing is ever dropped, just resorted, so "prioritise" never
 * means "hide". Passing `null` (nothing picked yet) returns the original
 * order unchanged, which is also what the server-rendered HTML uses - so a
 * client that hasn't picked a mood renders identically to the server and
 * hydrates without a layout shift.
 */
export function orderCategoriesForMood(mood: MoodKey | null) {
  if (!mood) return GUIDE_CATEGORIES;
  const priority = MOOD_CATEGORY_PRIORITY[mood];
  const priorityIndex = new Map(priority.map((key, i) => [key, i]));
  return [...GUIDE_CATEGORIES].sort((a, b) => {
    const aRank = priorityIndex.get(a.key) ?? priority.length;
    const bRank = priorityIndex.get(b.key) ?? priority.length;
    return aRank - bRank;
  });
}

export type TopPick = {
  category: GuideCategoryKey;
  categoryLabel: string;
  entry: GuideEntry;
};

/** Up to three real entries pulled from a mood's highest-priority categories, for an instant "here's what that actually means" answer before the user expands anything. */
export function topPicksForMood(guide: TownGuide, mood: MoodKey): TopPick[] {
  const picks: TopPick[] = [];
  for (const category of MOOD_CATEGORY_PRIORITY[mood]) {
    const entry = guide[category][0];
    if (!entry) continue;
    picks.push({ category, categoryLabel: CATEGORY_LABEL[category], entry });
    if (picks.length === 3) break;
  }
  return picks;
}
