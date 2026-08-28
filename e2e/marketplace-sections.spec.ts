import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Playwright's test process doesn't load .env the way `next dev` does.
// CI sets these vars directly instead of via a .env file, so don't fail
// when there isn't one to load.
try {
  process.loadEnvFile();
} catch {
  // no .env file, so assume the environment already has DATABASE_URL set
}

const prisma = new PrismaClient();

test("browse-by-category sections only appear once real data supports them", async ({ page }) => {
  const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@fystay.dev" } });

  // The seeded catalog has exactly one listing per city, so no "Popular in
  // <city>" or "Beach stays" section should exist yet.
  await page.goto("/");
  await expect(page.getByText(/^Popular in /)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Beach stays" })).toHaveCount(0);

  // Add a second Blackpool listing and a second sea-view listing so both
  // thresholds are met, mirroring how other e2e tests create temporary
  // fixture rows via Prisma rather than relying on any UI to seed them.
  const extraBlackpool = await prisma.listing.create({
    data: {
      title: "E2E fixture: second Blackpool stay",
      description: "Temporary listing created for this test.",
      city: "Blackpool",
      country: "England",
      pricePerNightCents: 6000,
      maxGuests: 2,
      photos: [],
      amenities: ["Wifi", "Ocean view"],
      hostId: host.id,
    },
  });

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Popular in Blackpool" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Beach stays" })).toBeVisible();

    // A search filter should hide the category rows entirely; they're only
    // for browsing the default homepage, not layered on top of results.
    await page.goto("/?city=Blackpool");
    await expect(page.getByRole("heading", { name: "Popular in Blackpool" })).toHaveCount(0);
  } finally {
    await prisma.listing.delete({ where: { id: extraBlackpool.id } });
    await prisma.$disconnect();
  }
});
