import { expect, test, type Browser, type Page } from "@playwright/test";

// Faster than the 5s poll, so passing this proves the realtime ping arrived.
const REALTIME_MS = 3000;

// The dev server compiles each route on first hit; do that before timing anything.
test.beforeAll(async ({ request }) => {
  for (const path of ["/", "/play/WARMUP"]) await request.get(path);
  await request.get("/api/rooms/WARMUP");
  for (const path of ["", "/WARMUP/join", "/WARMUP/moves", "/WARMUP/kick", "/WARMUP/end"]) {
    await request.post(`/api/rooms${path}`);
  }
});

async function player(browser: Browser, email: string, url = "/"): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(url);
  await page.getByLabel("Dev sign-in (local only)").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  return page;
}

async function answerRound(page: Page) {
  const groups = page.getByRole("radiogroup");
  for (let i = 0; i < (await groups.count()); i++) {
    await groups.nth(i).getByRole("radio").first().click();
  }
  const inputs = page.locator("main input:not([readonly])");
  for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill("bagels at midnight");
  await page.getByRole("button", { name: "Lock in", exact: true }).click();
}

test("two players play a full game in sync", async ({ browser }) => {
  test.setTimeout(180_000);
  const alice = await player(browser, "alice@cornell.edu");
  await alice.getByRole("button", { name: /we're a couple/ }).click();
  await expect(alice).toHaveURL(/\/play\/[A-Z0-9]{6}$/);
  const url = new URL(alice.url()).pathname;

  const bob = await player(browser, "bob@cornell.edu", url);
  await expect(bob.getByText("Alice & Bob are in.")).toBeVisible();
  await expect(alice.getByText("Alice & Bob are in.")).toBeVisible({ timeout: REALTIME_MS });

  const carol = await player(browser, "carol@cornell.edu", url);
  await expect(carol.getByRole("alert").filter({ hasText: "already has two players" })).toBeVisible();

  await alice.getByRole("button", { name: "I'm ready", exact: true }).click();
  await bob.getByRole("button", { name: "I'm ready", exact: true }).click();

  let rounds = 0;
  while (!(await alice.getByText("That's the day").isVisible())) {
    await expect(alice.getByRole("button", { name: "Lock in", exact: true })).toBeVisible({ timeout: REALTIME_MS });
    await expect(bob.getByRole("button", { name: "Lock in", exact: true })).toBeVisible({ timeout: REALTIME_MS });

    await answerRound(alice);
    await expect(alice.getByText("Locked in.")).toBeVisible();
    await expect(bob.getByText("Alice: locked in")).toBeVisible({ timeout: REALTIME_MS });

    await answerRound(bob);
    await expect(bob.getByRole("button", { name: "Next", exact: true })).toBeVisible();
    await expect(alice.getByRole("button", { name: "Next", exact: true })).toBeVisible({ timeout: REALTIME_MS });

    await bob.getByRole("button", { name: "Next", exact: true }).click();
    await alice.getByRole("button", { name: "Next", exact: true }).click();
    await expect(alice.getByText("That's the day").or(alice.getByRole("button", { name: "Lock in", exact: true }))).toBeVisible({
      timeout: REALTIME_MS,
    });
    rounds++;
    expect(rounds).toBeLessThan(20);
  }
  await expect(bob.getByText("That's the day")).toBeVisible({ timeout: REALTIME_MS });
  expect(rounds).toBe(13);
});
