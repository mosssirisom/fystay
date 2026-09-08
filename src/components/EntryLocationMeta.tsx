import { Car, Footprints, MapPin } from "lucide-react";
import type { EntryLocation } from "@/lib/guideLocation";

/**
 * The small "0.4 mi · ~8 min walk · ~2 min drive" row shown under a Local
 * Guide / Local Knowledge entry once a guest arrived via a specific
 * listing. Shared, plain (no "use client") component - used from both the
 * server-rendered LocalKnowledge and the client-rendered
 * LocalGuideExplorer, since it's pure presentation with no state of its
 * own either way. Renders nothing when there's no real distance to show,
 * rather than a placeholder implying one exists.
 */
export function EntryLocationMeta({ location }: { location: EntryLocation | null }) {
  if (!location) return null;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
      <span className="flex items-center gap-1">
        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
        {location.distanceMiles} mi
      </span>
      {location.walkMinutes !== null && (
        <span className="flex items-center gap-1">
          <Footprints className="h-3 w-3 shrink-0" aria-hidden />
          ~{location.walkMinutes} min walk
        </span>
      )}
      {location.driveMinutes !== null && (
        <span className="flex items-center gap-1">
          <Car className="h-3 w-3 shrink-0" aria-hidden />
          ~{location.driveMinutes} min drive
        </span>
      )}
    </p>
  );
}
