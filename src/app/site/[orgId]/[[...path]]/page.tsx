import type { Metadata } from "next";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { MessageCard } from "@/components/layout/site-frame";
import { requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";

// Organization sites are reached only through proxy.ts, which rewrites an organization host's paths
// to /site/<orgId>/…. Signed-in placeholder until the organization shell (layer 09).

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/[[...path]]">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `${site.name} · XYZ` };
}

export default async function OrganizationSitePlaceholder({ params }: PageProps<"/site/[orgId]/[[...path]]">) {
  const site = await requireOrganizationSite((await params).orgId);
  const user = await requireSession();

  return (
    <div className="flex h-dvh flex-col bg-brand">
      <AppHeader user={user} />
      <div className="mx-[18px] flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 items-center justify-center bg-brand-page p-[15px]">
          <MessageCard heading={site.name}>
            Signed in as {user.userName} ({user.roleName}). The organization pages come next.
          </MessageCard>
        </main>
      </div>
      <div className="mx-[18px] mb-1.5">
        <AppFooter />
      </div>
    </div>
  );
}
