import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/src/lib/env";

export async function createSupabaseServerClient() {
  const headerList = await headers();
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // In server components outside actions/route handlers, cookie mutation is disallowed; ignore.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Ignore when not permitted to mutate cookies.
          }
        },
      },
      headers: {
        "x-forwarded-for": headerList?.get?.("x-forwarded-for") ?? "",
      },
    },
  );
}
