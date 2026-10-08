"use client";

import { NavBar, type NavMenu } from "@/components/layout/nav-bar";

/**
 * Organization-site tabs: Organization-Info, then the menus the user may see (built by the layout from
 * GET /site/permissions/me), then Permissions for DEVELOPER / SUPERADMIN / ADMIN.
 */
export function OrganizationNav({ menus }: { menus: NavMenu[] }) {
  return <NavBar home={{ label: "Organization-Info", href: "/" }} menus={menus} />;
}
