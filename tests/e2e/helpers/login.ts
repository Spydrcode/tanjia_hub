import { Page, expect } from "@playwright/test";
import { resolveE2EOwnerId } from "./supabase";

export async function ensureLoggedIn(page: Page) {
  // E2E-only auth bypass: when enabled, tests should skip UI login entirely.
  if (process.env.E2E_AUTH_BYPASS === "true") {
    const ownerId = await resolveE2EOwnerId();
    await page.setExtraHTTPHeaders({ 'x-dev-bypass': '1', 'x-dev-owner': ownerId });
    await page.goto("/demo/today");
    await expect(page).not.toHaveURL(/\/tanjia\/login/);
    return;
  }

  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD must be set.");
  }

  await page.goto("/tanjia/today");

  if (!page.url().includes("/tanjia/login")) {
    return;
  }

  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/tanjia(\/today)?$/);
}
