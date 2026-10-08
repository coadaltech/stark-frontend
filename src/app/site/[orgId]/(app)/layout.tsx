import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import type { NavMenu } from "@/components/layout/nav-bar";
import { OrganizationNav } from "@/components/layout/organization-nav";
import { requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { getMyPermissions, PAGE_ROUTES, type PermissionMenu } from "@/lib/permissions";
import { canManagePermissions } from "@/lib/roles";

/**
 * Nav menus from the user's permissions: PAGE menus as plain tabs, GROUP menus as dropdowns of their
 * viewable sub-menus. Pages the app doesn't have a route for are skipped (and a GROUP left empty).
 */
function navMenus(menus: PermissionMenu[]): NavMenu[] {
  return menus.flatMap((menu): NavMenu[] => {
    if (menu.type === "PAGE") {
      const href = PAGE_ROUTES[menu.key];
      return href ? [{ label: menu.label, href, items: [] }] : [];
    }
    const items = menu.subMenus.flatMap((sub) => {
      const href = PAGE_ROUTES[sub.key];
      return href ? [{ label: sub.label, href }] : [];
    });
    return items.length ? [{ label: menu.label, items }] : [];
  });
}

// Organization sites are reached only through proxy.ts, which rewrites an organization host's paths to /site/<orgId>/….
export default async function OrganizationSiteLayout({ children, params }: LayoutProps<"/site/[orgId]">) {
  await requireOrganizationSite((await params).orgId);
  const user = await requireSession();
  const { menus } = await getMyPermissions();
  const nav = navMenus(menus);
  if (canManagePermissions(user.roleId)) nav.push({ label: "Permissions", href: "/permissions", items: [] });

  return (
    <div className="flex h-dvh flex-col bg-brand">
      <AppHeader user={user} />
      <div className="mx-[18px] flex min-h-0 flex-1 flex-col">
        <OrganizationNav menus={nav} />
        <main className="flex min-h-0 flex-1 flex-col bg-brand-page p-[15px]">{children}</main>
      </div>
      <div className="mx-[18px] mb-1.5">
        <AppFooter />
      </div>
    </div>
  );
}
