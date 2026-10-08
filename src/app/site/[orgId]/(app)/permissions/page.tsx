import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PermissionsTabs } from "@/components/permissions/permissions-tabs";
import { RolePermissionsTable } from "@/components/permissions/role-permissions-table";
import { StaffPermissionsTable } from "@/components/permissions/staff-permissions-table";
import { getAccessToken, requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import {
  getPermissionOptions,
  listRolePermissions,
  listStaffPermissions,
  type PermissionOptions,
  type RolePermission,
  type StaffPermission,
} from "@/lib/role-permissions";
import { canManagePermissions } from "@/lib/roles";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/permissions">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Permissions · ${site.name}` };
}

/** Permissions section (spec §6.2–6.3): DEVELOPER, SUPERADMIN and ADMIN only. */
export default async function PermissionsPage({ params }: PageProps<"/site/[orgId]/permissions">) {
  await requireOrganizationSite((await params).orgId);
  const user = await requireSession();
  if (!canManagePermissions(user.roleId)) notFound();

  const token = await getAccessToken();
  let permissions: RolePermission[] = [];
  let options: PermissionOptions = { menus: [], roles: [], grantable: {} };
  let staffPermissions: StaffPermission[] = [];
  let loadError: string | undefined;
  try {
    [permissions, options, staffPermissions] = await Promise.all([
      listRolePermissions(token),
      getPermissionOptions(token),
      listStaffPermissions(token),
    ]);
  } catch {
    loadError = "Could not load permissions. Please try again.";
  }

  return (
    <PermissionsTabs
      role={<RolePermissionsTable permissions={permissions} options={options} loadError={loadError} />}
      staff={<StaffPermissionsTable staffPermissions={staffPermissions} options={options} loadError={loadError} />}
    />
  );
}
