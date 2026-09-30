import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCard, SiteFrame } from "@/components/layout/site-frame";
import { getSite } from "@/lib/sites";

// Organization sites are reached only through proxy.ts, which rewrites an organization host's paths
// to /site/<orgId>/…. Placeholder until organization-site sign-in (layer 08).

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return { title: site?.kind === "organization" ? `${site.name} · XYZ` : "XYZ" };
}

export default async function OrganizationSitePlaceholder({ params }: PageProps<"/site/[orgId]/[[...path]]">) {
  const { orgId } = await params;
  // The host must still belong to this organization (never trust the path alone).
  const site = await getSite();
  if (site?.kind !== "organization" || String(site.organizationId) !== orgId) notFound();

  return (
    <SiteFrame title={site.name}>
      <MessageCard heading={site.name}>Sign-in for this site is coming soon.</MessageCard>
    </SiteFrame>
  );
}
