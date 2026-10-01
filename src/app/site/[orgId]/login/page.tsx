import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SiteFrame } from "@/components/layout/site-frame";
import { requireOrganizationSite } from "@/lib/org-site";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/login">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Sign in · ${site.name}` };
}

export default async function OrganizationLoginPage({ params, searchParams }: PageProps<"/site/[orgId]/login">) {
  const site = await requireOrganizationSite((await params).orgId);
  const { next } = await searchParams;
  return (
    <SiteFrame title={site.name}>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </SiteFrame>
  );
}
