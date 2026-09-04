/**
 * One-time backfill for listings created before src/lib/geocoding.ts
 * existed - new listings get coordinates automatically at creation (see
 * src/app/api/listings/route.ts), but that never runs retroactively for
 * rows already in the database. Safe to re-run: it only ever touches rows
 * where latitude is still null.
 */
import { PrismaClient } from "@prisma/client";
import { geocodeListing } from "../src/lib/geocoding";

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    where: { latitude: null },
    select: { id: true, city: true },
  });

  let geocoded = 0;
  for (const listing of listings) {
    const coordinates = geocodeListing(listing);
    if (!coordinates) continue;
    await prisma.listing.update({ where: { id: listing.id }, data: coordinates });
    geocoded++;
  }

  console.log(`Backfilled coordinates for ${geocoded} of ${listings.length} listing(s) without them.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
