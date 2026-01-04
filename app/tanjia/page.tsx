import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "2ndmynd Hub",
  description: "Listen. Clarify. Map. Decide. Support.",
};

export default async function TanjiaHubPage() {
  // Redirect hub to Today (Option A)
  await requireAuthOrRedirect();
  redirect('/tanjia/today');
}
