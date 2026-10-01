"use client";

import { NavBar, type NavMenu } from "@/components/layout/nav-bar";

const staffMenu: NavMenu = { label: "Staff", items: [{ label: "Staff", href: "/staff" }] };

/** Organization-site tabs: Organization-Info, plus Staff ▾ for roles that manage staff. */
export function OrganizationNav({ showStaff }: { showStaff: boolean }) {
  return <NavBar home={{ label: "Organization-Info", href: "/" }} menus={showStaff ? [staffMenu] : []} />;
}
