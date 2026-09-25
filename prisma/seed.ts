import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demoSeed";

const prisma = new PrismaClient();

async function main() {
  // This script writes published demo credentials (hostpass123/guestpass123)
  // and marks the mock hotel-affiliate provider ACTIVE (see demoSeed.ts's
  // own comment on why) - dev/test fixture data, never meant to land in a
  // real production database. Vercel sets VERCEL_ENV=production on real
  // deployments; refuse there unless someone explicitly opts in, rather
  // than trusting that `npm run db:seed`/`prisma db seed` is only ever run
  // by hand against a dev database.
  if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    console.error(
      "Refusing to seed: VERCEL_ENV=production. This would create demo accounts with " +
        "published test passwords and mark the mock hotel-affiliate provider ACTIVE in a real " +
        "production database. Set ALLOW_PRODUCTION_SEED=true if you specifically mean to do this.",
    );
    process.exit(1);
  }

  const summary = await seedDemoData(prisma);

  console.log("Seeded database:");
  console.log(`  host  -> ${summary.hostEmail} / hostpass123`);
  console.log(`  guest -> ${summary.guestEmail} / guestpass123`);
  console.log(`  ${summary.listingsCreated} listings created, ${summary.listingsSkippedExisting} already existed`);
  console.log(`  ${summary.reviewsCreated} completed stay(s) + review(s) created`);
  console.log(`  ${summary.extrasProvidersUpserted} trip-extras providers (EV Exec + 2 placeholders) + offerings upserted`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
