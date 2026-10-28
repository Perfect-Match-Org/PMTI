import { expect, test, type Browser, type Page } from "@playwright/test";
import postgres from "postgres";

const LOCAL_DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

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

async function answerRound(page: Page, text: string) {
  const groups = page.getByRole("radiogroup");
  for (let i = 0; i < (await groups.count()); i++) {
    await groups.nth(i).getByRole("radio").first().click();
  }
  const inputs = page.locator("main input:not([readonly])");
  for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill(text);
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

  for (let i = 0; i < 5; i++) await alice.getByRole("button", { name: "Send boo" }).click();
  await expect(bob.locator(".reaction-float", { hasText: "🍅" }).first()).toBeAttached({ timeout: REALTIME_MS });

  await alice.getByRole("button", { name: "I'm ready", exact: true }).click();
  await bob.getByRole("button", { name: "I'm ready", exact: true }).click();

  let rounds = 0;
  let vibeVerdicts = 0;
  while (!(await alice.getByText("Your duo type").isVisible())) {
    await expect(alice.getByRole("button", { name: "Lock in", exact: true })).toBeVisible({ timeout: REALTIME_MS });
    await expect(bob.getByRole("button", { name: "Lock in", exact: true })).toBeVisible({ timeout: REALTIME_MS });

    await answerRound(alice, "bagels at midnight");
    await expect(alice.getByText("Locked in.")).toBeVisible();
    await expect(bob.getByText("Alice: locked in")).toBeVisible({ timeout: REALTIME_MS });

    await answerRound(bob, "a late night bagel run");
    await expect(bob.getByRole("button", { name: "Next", exact: true })).toBeVisible();
    await expect(alice.getByRole("button", { name: "Next", exact: true })).toBeVisible({ timeout: REALTIME_MS });
    vibeVerdicts += await alice.getByText(/^\d+% vibe match$/).count();

    await bob.getByRole("button", { name: "Next", exact: true }).click();
    await alice.getByRole("button", { name: "Next", exact: true }).click();
    await expect(alice.getByText("Your duo type").or(alice.getByRole("button", { name: "Lock in", exact: true }))).toBeVisible({
      timeout: REALTIME_MS,
    });
    rounds++;
    expect(rounds).toBeLessThan(20);
  }
  await expect(bob.getByText("Your duo type")).toBeVisible({ timeout: REALTIME_MS });
  // Same type on both screens, and each player's role shows up on the other's screen.
  const typeName = await alice.getByRole("heading", { level: 1 }).innerText();
  await expect(bob.getByRole("heading", { level: 1 })).toHaveText(typeName);
  const aliceRole = (await alice.getByText(/^You're /).innerText()).replace(/^You're /, "");
  await expect(bob.getByText(`Alice is ${aliceRole}`)).toBeVisible();
  await expect(alice.getByText(/^Same Brain/)).toBeVisible();
  if (process.env.SHOTS) await alice.screenshot({ path: "test-results/result.png", fullPage: true });
  expect(rounds).toBe(13);
  // Mirror round shows two verdicts and the shared first-date round one; all scored via embeddings.
  expect(vibeVerdicts).toBe(3);

  // The lobby's reaction tally rode along on Alice's ready move.
  const sql = postgres(LOCAL_DB);
  const code = url.split("/").pop()!;
  const [row] = await sql`
    select m.payload from moves m join rooms r on r.id = m.room_id join auth.users u on u.id = m.player_id
    where r.code = ${code} and u.email = 'alice@cornell.edu' and m.round = -1 and m.kind = 'ready'`;
  await sql.end();
  expect(row?.payload).toEqual({ reactions: { "🍅": 5 } });
});
