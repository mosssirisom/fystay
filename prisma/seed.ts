import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demoSeed";

const prisma = new PrismaClient();

async function main() {
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
