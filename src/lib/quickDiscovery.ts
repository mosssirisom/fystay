import {
  Baby,
  Beer,
  Building2,
  CalendarDays,
  CloudRain,
  Coffee,
  Compass,
  PawPrint,
  ShoppingBag,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { GuideCategoryKey } from "@/lib/localGuide";

/**
 * The dozen large, one-tap entry points into a town guide the brief asks
 * for. Each either jumps straight to (and opens) one category in the
 * detailed guide further down the page, or - for the two that don't map to
 * a single existing category - opens several at once ("Essentials": local
 * amenities + transport + parking, which the guide already keeps as three
 * separate categories) or jumps to a dedicated live section ("What's On").
 * "Beach" and "Walks" (and "Drink" and "Nightlife") intentionally point at
 * the same underlying category - the guide doesn't currently split beach
 * content from walking-route content, or pub content from nightlife, so
 * both buttons opening the one section that covers both is honest rather
 * than a missing feature.
 */
export type QuickDiscoveryTarget =
  | { type: "categories"; keys: GuideCategoryKey[] }
  | { type: "section"; id: string };

export type QuickDiscoveryItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  target: QuickDiscoveryTarget;
};

export const QUICK_DISCOVERY: QuickDiscoveryItem[] = [
  { key: "eat", label: "Eat", icon: UtensilsCrossed, target: { type: "categories", keys: ["eat", "coffeeAndBreakfast"] } },
  { key: "drink", label: "Drink", icon: Coffee, target: { type: "categories", keys: ["pubsAndNightlife"] } },
  { key: "thingsToDo", label: "Things To Do", icon: Compass, target: { type: "categories", keys: ["thingsToDo"] } },
  { key: "family", label: "Family", icon: Baby, target: { type: "categories", keys: ["family"] } },
  { key: "beach", label: "Beach", icon: Waves, target: { type: "categories", keys: ["beachesAndWalks"] } },
  { key: "walks", label: "Walks", icon: Waves, target: { type: "categories", keys: ["beachesAndWalks"] } },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, target: { type: "categories", keys: ["shopping"] } },
  { key: "nightlife", label: "Nightlife", icon: Beer, target: { type: "categories", keys: ["pubsAndNightlife"] } },
  { key: "dogFriendly", label: "Dog Friendly", icon: PawPrint, target: { type: "categories", keys: ["dogFriendly"] } },
  { key: "rainyDay", label: "Rainy Day", icon: CloudRain, target: { type: "categories", keys: ["rainyDay"] } },
  {
    key: "essentials",
    label: "Essentials",
    icon: Building2,
    target: { type: "categories", keys: ["amenities", "transport", "parking"] },
  },
  { key: "whatsOn", label: "What's On", icon: CalendarDays, target: { type: "section", id: "whats-on" } },
];
