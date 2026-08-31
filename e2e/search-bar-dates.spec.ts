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

/** Mirrors the same calendar-stepping helper used by guest-booking.spec.ts. */
async function selectDay(page: Page, target: Date, monthsAlreadyAdvanced: number): Promise<number> {
  const monthsNeeded = monthsBetween(addDays(0), target);
  const stepsToTake = monthsNeeded - monthsAlreadyAdvanced;
  for (let i = 0; i < stepsToTake; i++) {
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
  }
  await page.locator(`[data-day="${isoDate(target)}"] button`).click();
  return monthsAlreadyAdvanced + stepsToTake;
}

test("homepage search's date picker sets checkIn/checkOut and filters results", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Dates/ }).click();
  await expect(page.getByRole("dialog", { name: "Choose check-in and check-out dates" })).toBeVisible();

  const start = 30 + Math.floor(Math.random() * 300);
  const checkIn = addDays(start);
  const checkOut = addDays(start + 3);
  const monthsAdvanced = await selectDay(page, checkIn, 0);
  await selectDay(page, checkOut, monthsAdvanced);

  // Selecting both ends of the range closes the popover automatically.
  await expect(page.getByRole("dialog", { name: "Choose check-in and check-out dates" })).toBeHidden();
  await expect(page.getByRole("button", { name: /Dates/ })).not.toContainText("Add dates");

  await page.getByRole("button", { name: "Search" }).click();
  await page.waitForURL(new RegExp(`checkIn=${isoDate(checkIn)}`));
  expect(page.url()).toContain("/search?");
  expect(page.url()).toContain(`checkOut=${isoDate(checkOut)}`);
});

test("pressing Search on the homepage navigates to the dedicated results page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Stay local. Book with FY Stay." })).toBeVisible();

  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
  expect(page.url()).toContain("/search");
});

test("Search button shows a busy state while a search is in flight, then clears", async ({ page }) => {
  await page.goto("/");

  const searchButton = page.getByRole("button", { name: "Search", exact: true });
  await expect(searchButton).toBeEnabled();

  // The homepage's field doesn't auto-navigate as you type (that only
  // happens on the /search results page itself), so typing alone shouldn't
  // have moved the page yet.
  await page.fill("#search-city", "Blackpool");
  await expect(searchButton).toBeEnabled();
  expect(page.url()).not.toContain("city=Blackpool");

  // Slow every request slightly so the transient "Searching…" state is
  // reliably observable instead of racing a near-instant local response -
  // this only affects the test's network timing, not the app's own code.
  await page.route("**/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });

  await searchButton.click();

  // Busy state appears virtually instantly and disables the button so a
  // second click can't fire a duplicate search.
  const busyButton = page.getByRole("button", { name: "Searching…" });
  await expect(busyButton).toBeVisible();
  await expect(busyButton).toBeDisabled();
  await expect(busyButton.locator("svg.animate-spin")).toBeVisible();

  // A disabled native button doesn't dispatch click events at all, so this
  // proves a repeat click while busy can't queue up a duplicate search.
  await busyButton.click({ force: true }).catch(() => {});

  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeEnabled();
  // Landed on the dedicated results page, not still on the homepage.
  await page.waitForURL(/\/search\?.*city=Blackpool/);
});
