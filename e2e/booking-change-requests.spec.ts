import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile();
} catch {
  // no .env file, so assume the environment already has DATABASE_URL set
}

const prisma = new PrismaClient();

function addDays(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

async function selectDay(page: Page, target: Date, monthsAlreadyAdvanced: number): Promise<number> {
  const monthsNeeded = monthsBetween(addDays(0), target);
  const stepsToTake = monthsNeeded - monthsAlreadyAdvanced;
  for (let i = 0; i < stepsToTake; i++) {
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
  }
  await page.locator(`[data-day="${isoDate(target)}"] button`).click();
  return monthsAlreadyAdvanced + stepsToTake;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL("/");
}

test("guest can request a date change, host approves, and guest pays the difference", async ({
  page,
  browser,
}) => {
  const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@fystay.dev" } });
  const guest = await prisma.user.findUniqueOrThrow({ where: { email: "guest@fystay.dev" } });

  const listing = await prisma.listing.create({
    data: {
      title: "E2E fixture: booking change request listing",
      description: "Temporary listing for the change-request flow test.",
      city: "TestChangeCity",
      country: "England",
      pricePerNightCents: 10000,
      maxGuests: 4,
      photos: [],
      amenities: [],
      hostId: host.id,
    },
  });

  const checkIn = addDays(120);
  const checkOut = addDays(122); // 2 nights, £200 total

  const booking = await prisma.booking.create({
    data: {
      listingId: listing.id,
      guestId: guest.id,
      checkIn,
      checkOut,
      guests: 2,
      totalPriceCents: 20000,
      status: "CONFIRMED",
    },
  });

  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  try {
    await login(page, "guest@fystay.dev", "guestpass123");
    await page.goto("/bookings");

    await page
      .locator(".p-4", { hasText: "E2E fixture: booking change request listing" })
      .getByRole("button", { name: "Request changes" })
      .click();

    await page.getByRole("dialog", { name: "Request a change" }).getByRole("button", { name: /–/ }).click();

    // Extend the stay by a night (3 nights instead of 2), which costs more.
    const newCheckOut = addDays(123);
    const monthsAdvanced = await selectDay(page, checkIn, 0);
    await selectDay(page, newCheckOut, monthsAdvanced);

    await expect(page.getByText(/You'll owe an extra/)).toBeVisible();
    await page.getByRole("button", { name: "Submit request" }).click();

    await expect(page.getByText("Change requested")).toBeVisible();
    await expect(page.getByText("Awaiting host response")).toBeVisible();

    // Host reviews and approves the request.
    await login(hostPage, "host@fystay.dev", "hostpass123");
    await hostPage.goto("/host/dashboard");
    await expect(hostPage.getByText("Guest requested a change")).toBeVisible();
    await expect(hostPage.getByText(/Guest will owe an extra/)).toBeVisible();
    await hostPage.getByRole("button", { name: "Approve" }).click();
    await expect(hostPage.getByText("Guest requested a change")).toHaveCount(0);

    // Guest pays the difference (dev mode: no Stripe keys, so it confirms immediately).
    await page.reload();
    await expect(page.getByRole("button", { name: /^Pay £/ })).toBeVisible();
    await page.getByRole("button", { name: /^Pay £/ }).click();
    await page.waitForURL(/dev_confirmed=1/, { timeout: 15_000 });

    const finalBooking = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(finalBooking.totalPriceCents).toBe(30000);
    expect(finalBooking.checkOut.toISOString().slice(0, 10)).toBe(isoDate(newCheckOut));
  } finally {
    await hostContext.close();
    await prisma.bookingChangeRequest.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.deleteMany({ where: { listingId: listing.id } });
    await prisma.listing.delete({ where: { id: listing.id } });
    await prisma.$disconnect();
  }
});
