import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Playwright's test process doesn't load .env the way `next dev` does.
// CI sets these vars directly instead of via a .env file, so don't fail
// when there isn't one to load.
try {
  process.loadEnvFile();
} catch {
  // no .env file — assume the environment already has DATABASE_URL set
}

const prisma = new PrismaClient();

test("guest can save a listing and unsave it from the wishlist page", async ({ page }) => {
  const guest = await prisma.user.findUniqueOrThrow({ where: { email: "guest@fystay.dev" } });
  const listing = await prisma.listing.findFirstOrThrow({ where: { published: true } });

  await prisma.savedListing.deleteMany({ where: { userId: guest.id, listingId: listing.id } });

  try {
    await page.goto("/login");
    await page.fill("#email", "guest@fystay.dev");
    await page.fill("#password", "guestpass123");
    await page.click("button[type=submit]");
    await page.waitForURL("/");

    await page.goto(`/listings/${listing.id}`);
    await page.getByRole("button", { name: "Save to wishlist" }).click();
    await expect(page.getByRole("button", { name: "Remove from wishlist" })).toBeVisible();

    await page.goto("/wishlist");
    await expect(page.getByText(listing.title)).toBeVisible();

    await page.getByRole("button", { name: "Remove from wishlist" }).click();
    await expect(page.getByText("No saved stays yet")).toBeVisible();
  } finally {
    await prisma.savedListing.deleteMany({ where: { userId: guest.id, listingId: listing.id } });
    await prisma.$disconnect();
  }
});
