import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function loadEnvFile(filename: string) {
  const p = path.resolve(process.cwd(), filename);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
    return true;
  }
  return false;
}

// Load env files in a Next.js-like order
const nodeEnv = process.env.NODE_ENV ?? "development";
const loaded: string[] = [];

for (const f of [".env.local", ".env"]) {
  if (loadEnvFile(f)) loaded.push(f);
}

// Optional: environment-specific files
if (nodeEnv === "development") {
  for (const f of [".env.development.local", ".env.development"]) {
    if (loadEnvFile(f)) loaded.push(f);
  }
}

const missing: string[] = [];
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
if (!process.env.OWNER_ID) missing.push("OWNER_ID");

if (missing.length) {
  throw new Error(
    `Missing required env vars for scripts: ${missing.join(", ")}.\n` +
      `Env files searched from repo root: .env.local, .env, .env.development.local, .env.development\n` +
      `Env files found/loaded: ${loaded.length ? loaded.join(", ") : "(none)"}\n` +
      `Fix: put the vars in .env.local (preferred) or .env in the repo root.`,
  );
}
