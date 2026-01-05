import { test, expect } from '@playwright/test';

test.describe('Demo click-test', () => {
  test('run through demo flows', async ({ page, request }) => {
    // Seed demo workspace via admin bypass
    const resetRes = await request.post('/api/demo/reset', {
      headers: { 'x-dev-bypass': '1', 'x-dev-owner': '20000000-0000-0000-0000-000000000001' },
    });
    expect(resetRes.ok()).toBeTruthy();

    // Open demo today
    await page.goto('/demo/today');
    await expect(page).not.toHaveTitle(/404|Not Found/);

    // Click: Leads → open a lead → back
    await page.getByRole('link', { name: /Leads|Signals|View all/i }).first().click().catch(() => {});
    // If navigation did not occur via link, navigate directly
    if (!page.url().includes('/demo/leads')) await page.goto('/demo/leads');
    await expect(page).toHaveURL(/\/demo\/leads/);
    // open first lead row
    const leadLink = page.locator('a').filter({ hasText: /Open|View|Lead/ }).first();
    if (await leadLink.count()) {
      await leadLink.click();
      await expect(page).not.toHaveURL(/404/);
      await page.goBack();
    }

    // Click: Meetings → open a meeting → Start → save interaction
    await page.goto('/demo/meetings');
    await expect(page).toHaveURL(/\/demo\/meetings/);
    // open first meeting
    const meetingLink = page.getByRole('link', { name: /View|Capture|Start/i }).first();
    if (await meetingLink.count()) {
      await meetingLink.click();
    } else {
      // try card link
      const cardLink = page.locator('a').filter({ hasText: /View/ }).first();
      if (await cardLink.count()) await cardLink.click();
    }
    await expect(page).not.toHaveTitle(/404/);
    // Click Start meeting button or Capture link
    const startBtn = page.getByRole('button', { name: /Start meeting|Start/i }).first();
    if (await startBtn.count()) await startBtn.click();
    // If redirected to start page, fill interaction form and submit
    if (page.url().includes('/start')) {
      await page.fill('input[name="person_name"]', 'Tester');
      await page.fill('input[name="company_name"]', 'Test Co');
      await page.fill('textarea[name="notes"]', 'Quick note');
      await page.click('button:has-text("Save interaction")');
      // ensure no 404
      await expect(page).not.toHaveTitle(/404/);
    }

    // Click: Followups → open one → mark done / reschedule
    await page.goto('/demo/followups');
    await expect(page).toHaveURL(/\/demo\/followups/);
    // mark first followup done if button exists
    const doneBtn = page.locator('button').filter({ hasText: /done|Done|Mark done/i }).first();
    if (await doneBtn.count()) await doneBtn.click();
    // try reschedule action (snooze) if available
    const snoozeBtn = page.locator('button').filter({ hasText: /snooze|Reschedule|Later/i }).first();
    if (await snoozeBtn.count()) await snoozeBtn.click();

    // Click: Support → paste text → generate → save draft
    await page.goto('/demo/support');
    await expect(page).toHaveURL(/\/demo\/support/);
    // Try to find a textarea and paste
    const ta = page.locator('textarea').first();
    if (await ta.count()) {
      await ta.fill('This is a demo support prompt.');
      // Click generate / suggest
      const gen = page.locator('button').filter({ hasText: /generate|suggest|compose/i }).first();
      if (await gen.count()) await gen.click();
      // Save draft
      const saveDraft = page.locator('button').filter({ hasText: /Save draft|Save/i }).first();
      if (await saveDraft.count()) await saveDraft.click();
    }

    // Click: Groups → open a group
    await page.goto('/demo/groups');
    await expect(page).toHaveURL(/\/demo\/groups/);
    const groupOpen = page.locator('a').filter({ hasText: /Open|View|Group/ }).first();
    if (await groupOpen.count()) await groupOpen.click();

    // Click: Referrals → create one
    await page.goto('/demo/referrals');
    await expect(page).toHaveURL(/\/demo\/referrals/);
    const newRef = page.locator('a').filter({ hasText: /New|Create|Referral/i }).first();
    if (await newRef.count()) await newRef.click();
    // Attempt to submit referral form if present
    const refForm = page.locator('form').first();
    if (await refForm.count()) {
      // try filling inputs
      await page.fill('input[name="to_name"]', 'Demo Person').catch(() => {});
      await page.fill('textarea[name="note"]', 'Referral note').catch(() => {});
      const submit = page.locator('button').filter({ hasText: /Create|Save|Send/i }).first();
      if (await submit.count()) await submit.click();
    }

    // Final check: ensure we're not on a 404 or redirected root
    const title = await page.title();
    expect(title).not.toMatch(/404|Not Found/);
  });
});
