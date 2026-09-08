import {
  Baby,
  Beer,
  Car,
  Coffee,
  Landmark,
  MapPin,
  Mountain,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trees,
  UtensilsCrossed,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { LocalPlaceCategory } from "@prisma/client";

/** Shared per-category icon so every live section (Today, FYStay Picks, Hidden Gems) agrees on what a category looks like. */
export const PLACE_CATEGORY_ICON: Record<LocalPlaceCategory, LucideIcon> = {
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  PUB: Beer,
  SHOP: ShoppingBag,
  SUPERMARKET: ShoppingCart,
  PHARMACY: Pill,
  PARK: Trees,
  BEACH: Waves,
  PLAYGROUND: Baby,
  ATTRACTION: Star,
  MUSEUM: Landmark,
  TOILET: MapPin,
  PARKING: Car,
  EV_CHARGING: Zap,
  VIEWPOINT: Mountain,
  OTHER: MapPin,
};

/** Shared per-category label, same reasoning as the icon map above. */
export const PLACE_CATEGORY_LABEL: Record<LocalPlaceCategory, string> = {
  RESTAURANT: "Restaurant",
  CAFE: "Café",
  PUB: "Pub",
  SHOP: "Shop",
  SUPERMARKET: "Supermarket",
  PHARMACY: "Pharmacy",
  PARK: "Park",
  BEACH: "Beach",
  PLAYGROUND: "Playground",
  ATTRACTION: "Attraction",
  MUSEUM: "Museum",
  TOILET: "Toilets",
  PARKING: "Parking",
  EV_CHARGING: "EV charging",
  VIEWPOINT: "Viewpoint",
  OTHER: "Local spot",
};

// A muted, distinct gradient pairing per category for generated card art
// (never a hotlinked stock photo - see TownHeroArt.tsx's doc comment for
// why this codebase avoids that entirely). Grouped so visually related
// categories (food & drink, outdoors, shopping) read as a family.
export const PLACE_CATEGORY_GRADIENT: Record<LocalPlaceCategory, [string, string]> = {
  RESTAURANT: ["#f59e0b", "#b45309"],
  CAFE: ["#d97706", "#92400e"],
  PUB: ["#a16207", "#713f12"],
  SHOP: ["#8b5cf6", "#5b21b6"],
  SUPERMARKET: ["#7c3aed", "#4c1d95"],
  PHARMACY: ["#e11d48", "#9f1239"],
  PARK: ["#16a34a", "#14532d"],
  BEACH: ["#0ea5e9", "#0369a1"],
  PLAYGROUND: ["#f472b6", "#9d174d"],
  ATTRACTION: ["#0d9488", "#134e4a"],
  MUSEUM: ["#475569", "#1e293b"],
  TOILET: ["#64748b", "#334155"],
  PARKING: ["#64748b", "#334155"],
  EV_CHARGING: ["#22c55e", "#166534"],
  VIEWPOINT: ["#0f766e", "#042f2c"],
  OTHER: ["#0d9488", "#134e4a"],
};
