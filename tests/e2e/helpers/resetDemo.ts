import { APIRequestContext, expect } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveE2EOwnerId } from "./supabase";

export type DemoResetCounts = Record<string, number>;

const lockPath = path.resolve(process.cwd(), ".playwright-demo-reset.lock");

async function acquireLock(timeoutMs: number = 10_000, intervalMs: number = 250) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const handle = await fs.open(lockPath, "wx");
      await handle.close();
      return;
    } catch (err: any) {
      if (err?.code !== "EEXIST") throw err;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error("Timeout acquiring demo reset lock");
}

async function releaseLock() {
  try {
    await fs.unlink(lockPath);
  } catch {
    // Ignore missing lock file
  }
}

export async function resetDemo(request: APIRequestContext) {
  const secret = process.env.DEMO_RESET_SECRET;
  if (!secret) {
    throw new Error("DEMO_RESET_SECRET is not set.");
  }

  const devOwner = await resolveE2EOwnerId().catch(() => process.env.E2E_OWNER_ID || process.env.DEV_DEMO_OWNER_ID);
  const devOwnerEmail = process.env.E2E_TEST_USER_EMAIL;

  await acquireLock();
  try {
    const response = await request.post("/api/demo/reset", {
      headers: {
        "x-demo-reset-secret": secret,
        ...(devOwner ? { "x-dev-owner": devOwner } : {}),
        ...(devOwnerEmail ? { "x-dev-owner-email": devOwnerEmail } : {}),
      },
    });

    if (!response.ok()) {
      const body = await response.text().catch(() => "");
      throw new Error(`Demo reset failed: ${response.status()} ${response.statusText()}${body ? `\n${body}` : ""}`);
    }

    const json = await response.json();
    expect(json.ok).toBeTruthy();

    const counts: DemoResetCounts = json.inserted || {};
    expect(counts.leads || 0).toBeGreaterThanOrEqual(3);
    expect(counts.meetings || 0).toBeGreaterThanOrEqual(2);
    expect(counts.followups || 0).toBeGreaterThanOrEqual(3);
    // Optional tables may not exist in all environments.
    // Do not hard-fail on these counts.

    return counts;
  } finally {
    await releaseLock();
  }
}
