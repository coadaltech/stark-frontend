import { cache } from "react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/session";

// Permissions on organization sites (specs/build/permissions/permission_spec.md).

export type PagePermission = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  /** SELF = all users' records including mine; ALL = excluding mine. */
  viewType: "ALL" | "SELF";
};

export type NavItem = { key: string; label: string; order: number };
export type PermissionMenu = NavItem & { type: "PAGE" | "GROUP"; subMenus: NavItem[] };

/** GET /site/permissions/me: viewable menus (nav order, this organization's labels) + actions per page key. */
export type MyPermissions = { menus: PermissionMenu[]; permissions: Record<string, PagePermission> };

/**
 * Where each page (menu / sub-menu key) lives in this app. Pages the API knows but the app doesn't
 * have yet are left out of the nav.
 */
export const PAGE_ROUTES: Record<string, string> = {
  "staff-list": "/staff",
  "shift-list": "/shifts",
};

/** Server only: the signed-in user's permissions on this organization site (one API call per request). */
export const getMyPermissions = cache(async () =>
  api<MyPermissions>("/site/permissions/me", { cache: "no-store", token: await getAccessToken() }),
);

/** The user's actions on one page, or null when they can't view it. */
export async function getPagePermission(pageKey: string): Promise<PagePermission | null> {
  return (await getMyPermissions()).permissions[pageKey] ?? null;
}
