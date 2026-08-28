import { test, expect, type Page } from "@playwright/test";

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

/** The calendar popover opens showing the current month; step forward as needed and click the day. */
async function selectDay(page: Page, target: Date, monthsAlreadyAdvanced: number): Promise<number> {
  const monthsNeeded = monthsBetween(addDays(0), target);
  const stepsToTake = monthsNeeded - monthsAlreadyAdvanced;
  for (let i = 0; i < stepsToTake; i++) {
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
  }
  await page.locator(`[data-day="${isoDate(target)}"] button`).click();
  return monthsAlreadyAdvanced + stepsToTake;
}

test("guest can log in, book a listing, and see it in their trips", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "guest@fystay.dev");
  await page.fill("#password", "guestpass123");
  await page.click("button[type=submit]");
  await page.waitForURL("/");

  await page.locator('a[href^="/listings/"]').first().click();
  await page.waitForURL(/\/listings\//);
  const listingTitle = (await page.locator("h1").first().textContent())!.trim();

  await page.getByRole("button", { name: "Add dates" }).click();

  // Randomized within a wide window so repeat local runs against the same
  // dev database don't collide with dates a previous run already booked.
  const start = 30 + Math.floor(Math.random() * 300);
  const checkIn = addDays(start);
  const checkOut = addDays(start + 3);
  const monthsAdvanced = await selectDay(page, checkIn, 0);
  await selectDay(page, checkOut, monthsAdvanced);

  await expect(page.getByText(/Total/)).toBeVisible();

  await page.getByRole("button", { name: "Check availability" }).click();
  await expect(page.getByRole("button", { name: "Continue to checkout" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to checkout" }).click();

  await page.waitForURL(/\/checkout\//, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Confirm and pay" })).toBeVisible();
  // Name/email are prefilled from the account; only phone is missing.
  await page.fill("#guestPhone", "07700 900123");
  await page.getByRole("button", { name: /Confirm and pay/ }).first().click();

  await page.waitForURL(/\/bookings\/.+\/confirmation/, { timeout: 15_000 });
  expect(page.url()).toContain("dev_confirmed=1");

  await expect(page.getByText("Booking confirmed!")).toBeVisible();
  await expect(page.getByText(listingTitle).first()).toBeVisible();
  await expect(page.getByText(/Booking #FY-/)).toBeVisible();

  await page.goto("/bookings");
  await expect(page.getByText(listingTitle).first()).toBeVisible();
  await expect(page.getByText("Confirmed").first()).toBeVisible();
});

test("logged-out guest is redirected to log in when trying to book", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[href^="/listings/"]').first().click();
  await page.waitForURL(/\/listings\//);

  await page.getByRole("button", { name: "Log in to book" }).click();
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("callbackUrl=/listings/");
});
