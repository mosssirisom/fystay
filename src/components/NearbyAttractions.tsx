import { MapPin, TrainFront } from "lucide-react";
import { nearbyLandmarks } from "@/lib/landmarks";

/**
 * A quiet proximity callout ("0.3 mi to Blackpool Tower"), not a map or a
 * data table - matched to how Booking.com/Airbnb surface this as one more
 * reason to book, not a feature in its own right. Every distance here
 * comes from the listing's own real (if approximate) coordinates against
 * real named landmarks - see src/lib/landmarks.ts - so this only ever
 * renders when there's something genuine to say; a listing with no
 * coordinates yet (see src/lib/geocoding.ts) simply skips the section
 * rather than showing a guess.
 */
export function NearbyAttractions({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  if (latitude === null || longitude === null) return null;

  const landmarks = nearbyLandmarks({ latitude, longitude });
  if (landmarks.length === 0) return null;

  return (
    <>
      <hr className="my-6 border-border-subtle" />
      <h2 className="text-lg font-semibold text-foreground">Getting around</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {landmarks.map((landmark) => (
          <li key={landmark.name} className="flex items-center gap-2.5 text-sm text-zinc-700">
            {landmark.category === "station" ? (
              <TrainFront className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            )}
            <span className="font-medium text-foreground">{landmark.name}</span>
            <span className="text-zinc-500">
              · {landmark.distanceMiles} mi
              {landmark.walkMinutes !== null && ` · ~${landmark.walkMinutes} min walk`}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
