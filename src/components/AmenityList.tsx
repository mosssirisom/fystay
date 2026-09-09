import {
  Accessibility,
  AirVent,
  BatteryCharging,
  Bath,
  Bike,
  Check,
  ChefHat,
  CookingPot,
  Dumbbell,
  Flame,
  Flower2,
  Laptop,
  ParkingCircle,
  PawPrint,
  Thermometer,
  Tv,
  Waves,
  Wifi,
  WashingMachine,
  Waypoints,
  Wind,
  type LucideIcon,
} from "lucide-react";

// Covers every option a host can pick in ListingForm's AMENITY_OPTIONS, plus
// a few earlier synonyms - anything not listed here (including a host's own
// free-text "Other amenities" entry) falls back to a plain checkmark rather
// than a missing icon.
const iconMap: Record<string, LucideIcon> = {
  wifi: Wifi,
  "free parking": ParkingCircle,
  kitchen: ChefHat,
  washer: WashingMachine,
  dryer: Wind,
  "air conditioning": AirVent,
  heating: Thermometer,
  tv: Tv,
  pool: Waves,
  "hot tub": Bath,
  gym: Dumbbell,
  "pet friendly": PawPrint,
  "wheelchair accessible": Accessibility,
  "step-free entrance": Accessibility,
  "wide doorways": Accessibility,
  "accessible bathroom": Accessibility,
  "elevator access": Accessibility,
  "accessible parking": Accessibility,
  "sea view": Waypoints,
  "ocean view": Waypoints,
  garden: Flower2,
  balcony: Waypoints,
  "bbq grill": CookingPot,
  fireplace: Flame,
  "dedicated workspace": Laptop,
  workspace: Laptop,
  "ev charger": BatteryCharging,
  "bikes included": Bike,
};

export function iconForAmenity(amenity: string): LucideIcon {
  return iconMap[amenity.toLowerCase()] ?? Check;
}

export function AmenityList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
      {amenities.map((amenity) => {
        const Icon = iconForAmenity(amenity);
        return (
          <li key={amenity} className="flex items-center gap-3 text-zinc-700">
            <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            {amenity}
          </li>
        );
      })}
    </ul>
  );
}
