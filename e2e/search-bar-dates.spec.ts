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
  expect(page.url()).toContain(`checkOut=${isoDate(checkOut)}`);
});
