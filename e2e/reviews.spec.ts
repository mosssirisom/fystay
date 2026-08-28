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

test("guest can leave a review for a completed stay", async ({ page }) => {
  const guest = await prisma.user.findUniqueOrThrow({ where: { email: "guest@fystay.dev" } });
  const listing = await prisma.listing.findFirstOrThrow({ where: { published: true } });

  // Reviews can only be left on a completed, paid-for stay — set one up
  // directly rather than through the booking flow, which is a separate
  // concern already covered by guest-booking.spec.ts.
  const booking = await prisma.booking.create({
    data: {
      listingId: listing.id,
      guestId: guest.id,
      checkIn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalPriceCents: listing.pricePerNightCents * 3,
      status: "CONFIRMED",
    },
  });

  const comment = `E2E review ${Date.now()} — fantastic stay, would recommend to anyone visiting.`;

  try {
    await page.goto("/login");
    await page.fill("#email", "guest@fystay.dev");
    await page.fill("#password", "guestpass123");
    await page.click("button[type=submit]");
    await page.waitForURL("/");

    await page.goto("/bookings");
    // Bookings are ordered newest-first, and this one was just created —
    // it's always the first row. (Filtering by "Leave a review" text would
    // go stale the moment that text disappears post-submission, and
    // filtering by listing title alone can match another booking of the
    // same listing, e.g. the seeded demo review.)
    await page.locator(".p-4").first().getByRole("button", { name: "Leave a review" }).click();

    await page.getByRole("radio", { name: "5 stars" }).click();
    await page.locator("textarea").fill(comment);
    await page.getByRole("button", { name: "Submit review" }).click();

    await expect(page.locator(".p-4").first().getByText("You reviewed this stay")).toBeVisible();

    await page.goto(`/listings/${listing.id}`);
    await expect(page.getByText(comment)).toBeVisible();
  } finally {
    await prisma.review.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.$disconnect();
  }
});
