import { test, expect } from "@playwright/test";

test("host can create, edit, and delete a listing", async ({ page }) => {
  const uniqueTitle = `E2E test cottage ${Date.now()}`;
  const updatedTitle = `${uniqueTitle} (updated)`;

  await page.goto("/login");
  await page.fill("#email", "host@fystay.dev");
  await page.fill("#password", "hostpass123");
  await page.click("button[type=submit]");
  await page.waitForURL("/");

  // --- Create ---
  await page.goto("/host/listings/new");
  await page.fill("#title", uniqueTitle);
  await page.fill(
    "#description",
    "A cosy place used only by the automated end-to-end test suite.",
  );
  await page.fill("#city", "Blackpool");
  await page.fill("#country", "England");
  await page.fill("#price", "99");

  await page.getByText("Or paste an image URL instead").click();
  await page.getByPlaceholder("https://example.com/photo.jpg").fill(
    "https://example.com/e2e-test-photo.jpg",
  );
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await page.getByRole("button", { name: "Create listing" }).click();
  await page.waitForURL("/host/dashboard");
  // Each listing row also renders a (hidden) delete-confirmation dialog
  // that repeats the title, so scope to the title link to stay unambiguous.
  await expect(page.getByRole("link", { name: uniqueTitle })).toBeVisible();

  // --- Edit ---
  const row = page.locator(".p-4").filter({ hasText: uniqueTitle });
  await row.getByRole("link", { name: "Edit" }).click();
  await page.waitForURL(/\/host\/listings\/.+\/edit/);

  await page.fill("#title", updatedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL("/host/dashboard");
  await expect(page.getByRole("link", { name: updatedTitle })).toBeVisible();

  // --- Delete ---
  const updatedRow = page.locator(".p-4").filter({ hasText: updatedTitle });
  await updatedRow.getByRole("button", { name: "Delete" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("link", { name: updatedTitle })).not.toBeVisible();
});
