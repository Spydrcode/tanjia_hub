import { test, expect } from "@playwright/test";
import { resetDemo } from "./helpers/resetDemo";
import { gotoDemo, gotoDirector } from "./helpers/gotoMode";
import { assertNoTanjiaLeak } from "./helpers/assertNoTanjiaLeak";
import { ensureLoggedIn } from "./helpers/login";

test.describe("Networking Hub smoke", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test.describe.serial("Demo flows (serial)", () => {
    test("Demo seed + home loads", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/today");

      await expect(page.getByTestId("topbar-mode-pill")).toHaveText(/DEMO/);
      await expect(page.getByTestId("today-quick-capture-input")).toBeVisible();
      await expect(page.getByTestId("today-upcoming-meetings-view-all")).toBeVisible();
      await expect(page.getByTestId("today-followups-view-all")).toBeVisible();
    });

    test("Mode switching preserves route", async ({ page }) => {
      await gotoDirector(page, "/today");

      await page.getByTestId("topbar-switch-mode").click();
      await expect(page).toHaveURL(/\/demo\/today/);
      await expect(page.getByTestId("topbar-mode-pill")).toHaveText(/DEMO/);

      await page.getByTestId("topbar-switch-mode").click();
      await expect(page).toHaveURL(/\/tanjia\/today/);
      await expect(page.getByTestId("topbar-mode-pill")).toHaveText(/DIRECTOR/);
    });

    test("Demo Today -> Leads -> Lead detail", async ({ page, request }) => {
      const counts = await resetDemo(request);
      console.log("Demo reset counts:", counts);
      await gotoDemo(page, "/today");

      await page.getByTestId("nav-leads").click();
      await page.waitForURL(/\/demo\/leads/);

      // Debug: check page HTML
      const pageHTML = await page.content();
      if (pageHTML.includes("No leads match this view")) {
        console.log("ƒsÿ‹,?  Empty state shown - leads filtered out or not created");
      }
      if (pageHTML.includes("leads-list")) {
        console.log("ƒo. leads-list element found in HTML");
      }

      // Wait for either leads list or empty state
      const hasLeads = await Promise.race([
        page.getByTestId("leads-list").waitFor({ state: "visible", timeout: 10000 }).then(() => true),
        page.getByText("No leads match this view").waitFor({ state: "visible", timeout: 10000 }).then(() => false),
      ]).catch(() => false);

      expect(hasLeads).toBe(true);
      const leadCount = await page.getByTestId("lead-row").count();
      expect(leadCount).toBeGreaterThan(0);

      await page.getByTestId("lead-row").first().click();
      await expect(page.getByTestId("lead-detail")).toBeVisible();
      await assertNoTanjiaLeak(page);
    });

    test("Demo Today -> Meetings list -> Meeting detail", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/today");

      await page.getByTestId("nav-meetings").click();
      await expect(page.getByTestId("meetings-list")).toBeVisible();
      const meetingCount = await page.getByTestId("meeting-row").count();
      expect(meetingCount).toBeGreaterThan(0);

      await page.getByTestId("meeting-row").first().getByRole("link", { name: "View" }).click();
      await expect(page.getByTestId("meeting-detail")).toBeVisible();
      await assertNoTanjiaLeak(page);
    });

    test("Demo Today -> Followups list", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/today");

      await page.getByTestId("today-followups-view-all").click();
      await expect(page.getByTestId("followups-list")).toBeVisible();
      const followupCount = await page.getByTestId("followup-row").count();
      expect(followupCount).toBeGreaterThan(0);
      await assertNoTanjiaLeak(page);
    });

    test("Demo Groups + detail", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/groups");

      await expect(page.getByTestId("groups-list")).toBeVisible();
      const groupCount = await page.getByTestId("group-row").count();
      if (groupCount === 0) {
        test.skip(true, "No group fixtures available in this environment.");
      }
      await page.getByTestId("group-row").first().getByRole("link", { name: /Open/i }).click();
      await expect(page.getByTestId("group-detail")).toBeVisible();
      await assertNoTanjiaLeak(page);
    });

    test("Demo Referrals + detail", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/referrals");

      await expect(page.getByTestId("referrals-list")).toBeVisible();
      const referralCount = await page.getByTestId("referral-row").count();
      if (referralCount === 0) {
        test.skip(true, "No referral fixtures available in this environment.");
      }
      await page.getByTestId("referral-row").first().getByRole("link", { name: /Open/i }).click();
      await expect(page.getByTestId("referral-detail")).toBeVisible();
      await assertNoTanjiaLeak(page);
    });

    test("Scheduler page renders", async ({ page }) => {
      await gotoDemo(page, "/scheduler");
      await expect(page.getByTestId("scheduler-embed")).toBeVisible();
    });
  });
});
