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
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
      headers: {
        "x-forwarded-for": headerList?.get?.("x-forwarded-for") ?? "",
      },
    },
  );
}
