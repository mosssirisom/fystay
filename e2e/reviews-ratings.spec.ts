import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateBookingReference } from "../src/lib/bookingReference";

try {
  process.loadEnvFile();
} catch {
  // no .env file, so assume the environment already has DATABASE_URL set
}

const prisma = new PrismaClient();

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL("/");
}

async function createSecondGuest() {
  const email = `e2e-second-guest-${generateBookingReference()}@fystay.dev`.toLowerCase();
  const passwordHash = await bcrypt.hash("secondguestpass123", 10);
  const user = await prisma.user.create({
    data: { name: "Sam Traveller", email, passwordHash, role: "GUEST" },
  });
  return { ...user, password: "secondguestpass123" };
}

async function createCompletedBooking(listingId: string, guestId: string) {
  const checkIn = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const checkOut = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  return prisma.booking.create({
    data: {
      reference: generateBookingReference(),
      listingId,
      guestId,
      checkIn,
      checkOut,
      guests: 2,
      nights: 2,
      nightlyPriceCents: 10000,
      serviceFeeCents: 2000,
      totalPriceCents: 22000,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    },
  });
}

test.describe("reviews and ratings", () => {
  let hostId: string;
  let guestId: string;

  test.beforeAll(async () => {
    const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@fystay.dev" } });
    const guest = await prisma.user.findUniqueOrThrow({ where: { email: "guest@fystay.dev" } });
    hostId = host.id;
    guestId = guest.id;
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createListing() {
    return prisma.listing.create({
      data: {
        title: `E2E fixture: reviews listing ${generateBookingReference()}`,
        description: "Temporary listing for the reviews and ratings flow tests.",
        city: "ReviewsTestCity",
        country: "England",
        pricePerNightCents: 10000,
        maxGuests: 4,
        photos: [],
        amenities: [],
        hostId,
      },
    });
  }

  test("a guest can leave a review with category ratings, shown as a verified stay under their first name", async ({
    page,
  }) => {
    const listing = await createListing();
    const booking = await createCompletedBooking(listing.id, guestId);

    try {
      await login(page, "guest@fystay.dev", "guestpass123");
      await page.goto("/bookings");
      await page.getByRole("tab", { name: /Past trips/ }).click();

      const card = page.locator(".p-4", { hasText: listing.title });
      await card.getByRole("button", { name: "Leave a review" }).click();

      const dialog = page.getByRole("dialog", { name: `Review ${listing.title}` });
      await dialog.getByRole("radio", { name: "5 stars", exact: true }).first().click();
      // The first "5 stars" radio belongs to the overall rating; also rate
      // one category to confirm optional category ratings are accepted.
      await dialog.getByRole("radiogroup", { name: "Cleanliness" }).getByRole("radio", { name: "4 stars" }).click();
      await dialog.locator("textarea").fill("Fantastic location and a very comfortable stay.");
      await dialog.getByRole("button", { name: "Submit review" }).click();
      await expect(page.getByText("Review submitted")).toBeVisible();

      await page.goto(`/listings/${listing.id}`);
      const main = page.locator("#main-content");
      await expect(main.getByText("1 review", { exact: true })).toBeVisible();
      await expect(main.getByText("Cleanliness")).toBeVisible();
      await expect(main.getByText("Verified stay")).toBeVisible();
      // First name only, not the full seeded "Jamie Guest".
      await expect(main.getByText("Jamie", { exact: true })).toBeVisible();
      await expect(main.getByText("Jamie Guest")).toHaveCount(0);
    } finally {
      await prisma.review.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.listing.delete({ where: { id: listing.id } });
    }
  });

  test("a host can respond to a review, and the response is shown publicly", async ({ page }) => {
    const listing = await createListing();
    const booking = await createCompletedBooking(listing.id, guestId);
    const review = await prisma.review.create({
      data: {
        listingId: listing.id,
        authorId: guestId,
        bookingId: booking.id,
        rating: 4,
        comment: "Really enjoyed the stay, would come back.",
      },
    });

    try {
      await login(page, "host@fystay.dev", "hostpass123");
      await page.goto(`/host/listings/${listing.id}/reviews`);
      await expect(page.getByText("Really enjoyed the stay, would come back.")).toBeVisible();

      await page.locator("textarea").fill("Thanks so much for staying with us!");
      await page.getByRole("button", { name: "Post response" }).click();
      await expect(page.getByText("Response published")).toBeVisible();
      await expect(page.getByText("Your response")).toBeVisible();

      await page.goto(`/listings/${listing.id}`);
      const main = page.locator("#main-content");
      await expect(main.getByText("Response from Alex Host")).toBeVisible();
      await expect(main.getByText("Thanks so much for staying with us!")).toBeVisible();
    } finally {
      await prisma.review.delete({ where: { id: review.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.listing.delete({ where: { id: listing.id } });
    }
  });

  test("another guest can report a review once, but not twice, and not their own", async ({
    page,
    browser,
  }) => {
    const listing = await createListing();
    const booking = await createCompletedBooking(listing.id, guestId);
    const review = await prisma.review.create({
      data: {
        listingId: listing.id,
        authorId: guestId,
        bookingId: booking.id,
        rating: 3,
        comment: "It was fine, nothing special either way.",
      },
    });
    const secondGuest = await createSecondGuest();
    const secondGuestContext = await browser.newContext();
    const secondGuestPage = await secondGuestContext.newPage();

    try {
      // The author can't report their own review.
      await login(page, "guest@fystay.dev", "guestpass123");
      const ownReportRes = await page.request.post(`/api/reviews/${review.id}/report`, {
        data: { reason: "other" },
      });
      expect(ownReportRes.status()).toBe(409);

      // A different guest can report it once...
      await login(secondGuestPage, secondGuest.email, secondGuest.password);
      await secondGuestPage.goto(`/listings/${listing.id}`);
      const main = secondGuestPage.locator("#main-content");
      await main.getByRole("button", { name: "Report" }).click();
      await secondGuestPage
        .getByRole("dialog", { name: "Report this review" })
        .getByRole("button", { name: "Submit report" })
        .click();
      await expect(secondGuestPage.getByText("Thanks, we'll take a look.")).toBeVisible();
      await expect(main.getByText("Reported", { exact: true })).toBeVisible();

      // ...but not a second time.
      const secondReportRes = await secondGuestPage.request.post(`/api/reviews/${review.id}/report`, {
        data: { reason: "spam" },
      });
      expect(secondReportRes.status()).toBe(409);
    } finally {
      await secondGuestContext.close();
      await prisma.reviewReport.deleteMany({ where: { reviewId: review.id } });
      await prisma.review.delete({ where: { id: review.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.listing.delete({ where: { id: listing.id } });
      await prisma.user.delete({ where: { id: secondGuest.id } });
    }
  });

  test("a guest can't create a review for a booking that isn't theirs", async ({ page }) => {
    const listing = await createListing();
    const booking = await createCompletedBooking(listing.id, guestId);
    const secondGuest = await createSecondGuest();

    try {
      await login(page, secondGuest.email, secondGuest.password);
      const res = await page.request.post("/api/reviews", {
        data: { bookingId: booking.id, rating: 5, comment: "Trying to review a stay that wasn't mine." },
      });
      expect(res.status()).toBe(403);

      const reviews = await prisma.review.findMany({ where: { bookingId: booking.id } });
      expect(reviews).toHaveLength(0);
    } finally {
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.listing.delete({ where: { id: listing.id } });
      await prisma.user.delete({ where: { id: secondGuest.id } });
    }
  });
});
