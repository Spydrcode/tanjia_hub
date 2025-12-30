import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createLead } from "../actions";
import { tanjiaConfig } from "@/lib/tanjia-config";

export const metadata: Metadata = {
  title: "New Lead",
  description: "Add a lead to Tanjia.",
  robots: { index: false, follow: false },
};

export default function NewLeadPage() {
  async function action(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string) || "";
    const website = (formData.get("website") as string) || "";
    const location = (formData.get("location") as string) || "";
    const email = (formData.get("email") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const status = (formData.get("status") as string) || "new";
    const leadId = await createLead({ name, website, location, email, notes, status });
    redirect(`/tanjia/leads/${leadId}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16 sm:py-20">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">New lead</h1>
          </div>
          <Link href="/tanjia/leads" className="text-sm text-neutral-600 underline hover:text-neutral-800">
            Back
          </Link>
        </header>

        <form action={action} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Name</span>
            <input
              name="name"
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="Lead name"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Website</span>
            <input
              name="website"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="https://example.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Location</span>
            <input
              name="location"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="City, region"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Email (optional)</span>
            <input
              name="email"
              type="email"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Status</span>
            <input
              name="status"
              defaultValue="new"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Notes</span>
            <textarea
              name="notes"
              className="min-h-[120px] rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="Context, constraints, or shared interests"
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Create lead
          </button>
        </form>

        <footer className="border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          <Link href={tanjiaConfig.siteUrl} className="hover:text-neutral-800" target="_blank" rel="noreferrer">
            2ndmynd
          </Link>
        </footer>
      </div>
    </main>
  );
}
