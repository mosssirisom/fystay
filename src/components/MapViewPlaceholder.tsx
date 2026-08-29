import { MapPinned } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * An honest foundation for map view, not a fake interactive map: Listing
 * has no latitude/longitude yet, so rendering pins on a real map would mean
 * either fabricating coordinates or pulling in a full mapping stack for a
 * handful of Fylde Coast towns. The List | Map toggle itself is fully wired
 * (it's real URL state, not a dead button) and this pane already knows the
 * real city breakdown of the current results, so a future task can drop a
 * real map in here without changing how the toggle or the results work.
 */
export function MapViewPlaceholder({ cityCounts }: { cityCounts: Map<string, number> }) {
  const cities = Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <MapPinned className="h-8 w-8 text-zinc-300" />
      <p className="font-medium text-foreground">Map view is coming soon</p>
      <p className="max-w-sm text-sm text-zinc-500">
        We&apos;re working on an interactive map for the Fylde Coast. For now, here&apos;s where
        your matching stays are:
      </p>
      {cities.length > 0 && (
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {cities.map(([city, count]) => (
            <li
              key={city}
              className="rounded-full bg-surface-muted px-3 py-1 text-sm text-zinc-700"
            >
              {city} · {count}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
