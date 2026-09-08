import { prisma } from "@/lib/prisma";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";
import { TOWN_COORDINATES } from "@/lib/geocoding";

/**
 * Upserts the LocalTown table from the app's single existing list of towns
 * (FYLDE_COAST_DESTINATIONS) and their coordinates (TOWN_COORDINATES,
 * already used for listing map pins) - so the local-data platform never
 * maintains its own, second copy of "which towns does FYStay cover" that
 * could drift from the one the rest of the app already uses. Cheap and
 * idempotent, so every local-data route can call this before reading/
 * writing town-scoped rows rather than requiring a separate deploy step.
 */
export async function ensureTownsSeeded(): Promise<void> {
  await Promise.all(
    FYLDE_COAST_DESTINATIONS.map((destination) => {
      const coordinates = TOWN_COORDINATES[destination.searchCity.toLowerCase()];
      if (!coordinates) return Promise.resolve();
      return prisma.localTown.upsert({
        where: { slug: destination.slug },
        create: {
          slug: destination.slug,
          name: destination.name,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        update: {
          name: destination.name,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      });
    }),
  );
}
