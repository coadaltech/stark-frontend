import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { OrganizationNav } from "@/components/layout/organization-nav";
import { requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { canManageStaff } from "@/lib/roles";

// Organization sites are reached only through proxy.ts, which rewrites an organization host's paths to /site/<orgId>/….
export default async function OrganizationSiteLayout({ children, params }: LayoutProps<"/site/[orgId]">) {
  await requireOrganizationSite((await params).orgId);
  const user = await requireSession();
  return (
    <div className="flex h-dvh flex-col bg-brand">
      <AppHeader user={user} />
      <div className="mx-[18px] flex min-h-0 flex-1 flex-col">
        <OrganizationNav showStaff={canManageStaff(user.roleId)} />
        <main className="flex min-h-0 flex-1 flex-col bg-brand-page p-[15px]">{children}</main>
      </div>
      <div className="mx-[18px] mb-1.5">
        <AppFooter />
      </div>
    </div>
  );
}
