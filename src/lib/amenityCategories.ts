import { Accessibility, ParkingCircle, PawPrint, Snowflake, UtensilsCrossed, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isPetFriendly } from "@/lib/search";

/**
 * Hosts type amenities as freeform text ("Free parking", "Sea view", ...),
 * so a filter checkbox can't match those strings exactly - it has to
 * recognize the same amenity described a few different ways. Each category
 * here is a keyword test against a listing's real amenities array, the same
 * approach isPetFriendly already used for "pets welcome" vs "Pet friendly".
 * A category is only ever offered as a filter once at least one published
 * listing actually matches it (see listingsWithAmenityCategories below) -
 * never a checkbox with nothing behind it.
 */
export type AmenityCategory = {
  key: string;
  label: string;
  icon: LucideIcon;
  test: (amenities: string[]) => boolean;
};

/**
 * The icon and test function on AmenityCategory aren't plain data, so they
 * can't cross the server/client boundary as props - a client component that
 * just needs to render filter chips gets this serializable subset instead.
 */
export type AmenityCategorySummary = { key: string; label: string };

export const AMENITY_CATEGORIES: AmenityCategory[] = [
  { key: "wifi", label: "Wi-Fi", icon: Wifi, test: (a) => a.some((x) => /wi-?fi/i.test(x)) },
  {
    key: "parking",
    label: "Parking",
    icon: ParkingCircle,
    test: (a) => a.some((x) => /parking/i.test(x)),
  },
  {
    key: "kitchen",
    label: "Kitchen",
    icon: UtensilsCrossed,
    test: (a) => a.some((x) => /kitchen/i.test(x)),
  },
  {
    key: "air_conditioning",
    label: "Air conditioning",
    icon: Snowflake,
    test: (a) => a.some((x) => /air.?con|a\/c\b/i.test(x)),
  },
  {
    key: "pet_friendly",
    label: "Pet friendly",
    icon: PawPrint,
    test: (a) => isPetFriendly(a),
  },
  // Five specific, independently-checkable features rather than one catch-
  // all "Accessible" toggle - a guest who actually needs, say, a roll-in
  // shower can't tell that from a single blanket badge, and a host ticking
  // one shouldn't be read as claiming all five. Worded to match the
  // specific AMENITY_OPTIONS entries in ListingForm.tsx one-for-one, the
  // same convention as every other category above.
  {
    key: "step_free_entrance",
    label: "Step-free entrance",
    icon: Accessibility,
    test: (a) => a.some((x) => /step-?free entr/i.test(x)),
  },
  {
    key: "wide_doorways",
    label: "Wide doorways",
    icon: Accessibility,
    test: (a) => a.some((x) => /wide doorway|wide hallway/i.test(x)),
  },
  {
    key: "accessible_bathroom",
    label: "Accessible bathroom",
    icon: Accessibility,
    test: (a) => a.some((x) => /accessible bathroom|roll-in shower|grab rail/i.test(x)),
  },
  {
    key: "elevator_access",
    label: "Elevator access",
    icon: Accessibility,
    test: (a) => a.some((x) => /elevator|lift access/i.test(x)),
  },
  {
    key: "accessible_parking",
    label: "Accessible parking",
    icon: Accessibility,
    test: (a) => a.some((x) => /accessible parking|disabled parking/i.test(x)),
  },
];

/** True only if the amenities list satisfies every selected category (AND, not OR). */
export function matchesAmenityCategories(amenities: string[], selectedKeys: string[]): boolean {
  if (selectedKeys.length === 0) return true;
  return selectedKeys.every((key) => {
    const category = AMENITY_CATEGORIES.find((c) => c.key === key);
    return category ? category.test(amenities) : true;
  });
}

/** Which of the canonical categories are actually backed by real listing data right now. */
export function availableAmenityCategories(
  listings: { amenities: string[] }[],
): AmenityCategory[] {
  return AMENITY_CATEGORIES.filter((category) =>
    listings.some((listing) => category.test(listing.amenities)),
  );
}
