import { test, expect } from "@playwright/test";

test.describe("Tanjia smoke", () => {
  test("Explore falls back safely when empty", async ({ page }) => {
    await page.goto("/tanjia/explore");

    await expect(page.getByText("Growth changes responsibility before it changes systems.")).toBeVisible();
    await expect(page.getByText("Nothing pending — listen.")).toBeVisible();
  });

  test("Explore ?lead= loads and Next works (seeded)", async ({ page }) => {
    await page.goto("/tanjia/explore");

    const next = page.getByRole("link", { name: "Next →" });
    if (await next.count()) {
      const href = await next.first().getAttribute("href");
      expect(href).toContain("/tanjia/explore?lead=");
      await next.first().click();
      await expect(page).toHaveURL(/\/tanjia\/explore\?lead=/);
    }
  });

  test("Present renders and has share actions", async ({ page }) => {
    await page.goto("/tanjia/present");

    await expect(page.getByRole("heading", { name: /Growth doesn/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Second Look" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy note" })).toBeVisible();
  });
});
