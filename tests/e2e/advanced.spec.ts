import { test, expect } from "@playwright/test";
import { resetDemo } from "./helpers/resetDemo";
import { gotoDemo } from "./helpers/gotoMode";
import { assertNoTanjiaLeak } from "./helpers/assertNoTanjiaLeak";
import { ensureLoggedIn } from "./helpers/login";
import { getAdminClient, countMessagesForLead } from "./helpers/supabase";

test.describe("Networking Hub advanced flows", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test.describe.serial("Demo advanced flows (serial)", () => {
    test("Quick capture -> Support prefill -> Generate", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/today");

      const sampleText = "Test reply needed for a follow-up.";
      await page.route("**/api/tanjia/networking/reply", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ reply: "Thanks for the update. Happy to help." }),
        });
      });

      await page.getByTestId("today-quick-capture-input").fill(sampleText);
      await page.getByTestId("today-action-draft-reply").click();

      await expect(page).toHaveURL(/\/demo\/support/);
      await expect(page.getByTestId("support-input")).toHaveValue(sampleText);

      await page.getByTestId("support-generate").click();
      await expect(page.getByTestId("support-result-reply")).toHaveText(/Thanks for the update/);
      await assertNoTanjiaLeak(page);
    });

    test("Save draft persists via messages table (if drafts exist)", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/leads");

      const leadRow = page.getByTestId("lead-row").first();
      const leadId = await leadRow.getAttribute("data-lead-id");
      if (!leadId) {
        test.skip(true, "No lead id available to verify drafts.");
      }

      await leadRow.click();
      await expect(page.getByTestId("lead-detail")).toBeVisible();

      await page.getByRole("button", { name: "Draft Messages" }).click();
      const noDrafts = await page.getByText("No drafts yet.").count();
      if (noDrafts > 0) {
        test.skip(true, "No draft fixtures available to verify persistence.");
      }

      const admin = getAdminClient();
      const beforeCount = await countMessagesForLead(admin, leadId as string);

      await page.getByTestId("lead-draft-save").first().click();
      await expect.poll(async () => countMessagesForLead(admin, leadId as string)).toBeGreaterThan(beforeCount);
    });

    test("Meeting start -> add interaction -> verify interaction list", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/meetings");

      await page.getByTestId("meeting-row").first().getByRole("link", { name: "View" }).click();
      await expect(page.getByTestId("meeting-detail")).toBeVisible();

      await page.getByTestId("meeting-start").click();
      await expect(page.getByTestId("meeting-add-interaction")).toBeVisible();

      await page.getByTestId("meeting-interaction-input").fill("Met a new contact with a strong referral.");
      await page.getByTestId("meeting-interaction-save").click();

      await expect(page.getByTestId("meeting-interactions-list")).toBeVisible();
    });

    test("Followup mark done updates UI after reload", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/followups");

      const row = page.getByTestId("followup-row").first();
      const followupId = await row.getAttribute("data-followup-id");

      await page.getByTestId("followup-mark-done").first().click();
      await expect(page.getByText("Marked done")).toBeVisible();

      await page.reload();
      if (followupId) {
        await expect(page.locator(`[data-followup-id="${followupId}"]`)).toHaveCount(0);
      }
    });

    test("Demo does not leak to director routes", async ({ page, request }) => {
      await resetDemo(request);
      await gotoDemo(page, "/today");

      await page.getByTestId("nav-leads").click();
      await assertNoTanjiaLeak(page);
      await page.getByTestId("nav-meetings").click();
      await assertNoTanjiaLeak(page);
      await page.getByTestId("nav-groups").click();
      await assertNoTanjiaLeak(page);
      await page.getByTestId("nav-referrals").click();
      await assertNoTanjiaLeak(page);
      await page.getByTestId("nav-support").click();
      await assertNoTanjiaLeak(page);
    });
  });
});
