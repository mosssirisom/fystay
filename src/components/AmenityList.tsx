import {
  AirVent,
  Bike,
  Check,
  ChefHat,
  Laptop,
  ParkingCircle,
  Waves,
  Wifi,
  WashingMachine,
  Waypoints,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  kitchen: ChefHat,
  "air conditioning": AirVent,
  "free parking": ParkingCircle,
  pool: Waves,
  washer: WashingMachine,
  workspace: Laptop,
  "ocean view": Waypoints,
  "bikes included": Bike,
};

export function AmenityList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <ul className="mt-3 grid grid-cols-2 gap-3 text-zinc-700">
      {amenities.map((amenity) => {
        const Icon = iconMap[amenity.toLowerCase()] ?? Check;
        return (
          <li key={amenity} className="flex items-center gap-2.5">
            <Icon className="h-4.5 w-4.5 shrink-0 text-zinc-500" />
            {amenity}
          </li>
        );
      })}
    </ul>
  );
}
