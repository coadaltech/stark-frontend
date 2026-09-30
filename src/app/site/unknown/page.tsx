import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Site not found · XYZ" };

// proxy.ts rewrites hosts that aren't the main app or an organization site here → 404 "Site not found".
export default function UnknownSitePage() {
  notFound();
}
