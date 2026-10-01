import { notFound } from "next/navigation";
import { getSite } from "@/lib/sites";

/**
 * For pages under /site/[orgId]: the organization site the request's host belongs to. 404 unless the
 * host still resolves to that organization (the path alone is never trusted).
 */
export async function requireOrganizationSite(orgId: string) {
  const site = await getSite();
  if (site?.kind !== "organization" || String(site.organizationId) !== orgId) notFound();
  return site;
}
