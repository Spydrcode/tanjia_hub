import { Page, expect } from "@playwright/test";

export async function gotoDemo(page: Page, path: string = "/today") {
  await page.goto(`/demo${path}`);
  await expect(page.getByTestId("topbar-mode-pill")).toHaveText(/DEMO/);
}

export async function gotoDirector(page: Page, path: string = "/today") {
  await page.goto(`/tanjia${path}`);
  await expect(page.getByTestId("topbar-mode-pill")).toHaveText(/DIRECTOR/);
}
