import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";
import { tanjiaConfig } from "@/lib/tanjia-config";

export const metadata: Metadata = {
  title: "Tanjia Login",
  description: "Sign in to the Tanjia networking hub.",
  robots: { index: false, follow: false },
};

export default function TanjiaLoginPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-16 sm:py-20">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sign in</h1>
          <p className="text-base leading-7 text-neutral-700">Quiet access to your leads and helper.</p>
        </header>

        <LoginForm />

        <footer className="border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          <Link href={tanjiaConfig.siteUrl} className="hover:text-neutral-800" target="_blank" rel="noreferrer">
            2ndmynd
          </Link>
        </footer>
      </div>
    </main>
  );
}
