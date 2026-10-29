import { expect, test } from "@playwright/test";

test("a player signs in and out", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Dev sign-in (local only)").fill("someone@gmail.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in as")).toContainText("someone@gmail.com");

  await page.reload();
  await expect(page.getByText("Signed in as")).toContainText("someone@gmail.com");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByLabel("Dev sign-in (local only)")).toBeVisible();
});
