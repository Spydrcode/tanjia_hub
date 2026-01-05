import { Page, expect } from "@playwright/test";

export async function assertNoTanjiaLeak(page: Page) {
  const url = page.url();
  expect(url).toContain("/demo/");
  const tanjiaLinks = page.locator('a[href*="/tanjia/"]');
  await expect(tanjiaLinks).toHaveCount(0);
}
