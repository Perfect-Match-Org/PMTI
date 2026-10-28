import { expect, test } from "@playwright/test";

test("non-Cornell email is rejected with a clear message", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Dev sign-in (local only)").fill("someone@gmail.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "PMTI is for Cornell accounts" })
  ).toBeVisible();
});

test("Cornell user signs in and out", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Dev sign-in (local only)").fill("alice@cornell.edu");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in as")).toContainText("alice@cornell.edu");

  await page.reload();
  await expect(page.getByText("Signed in as")).toContainText("alice@cornell.edu");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByLabel("Dev sign-in (local only)")).toBeVisible();
});
