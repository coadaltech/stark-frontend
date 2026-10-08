import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaffTable } from "@/components/staff/staff-table";
import { getAccessToken, requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { getPagePermission } from "@/lib/permissions";
import { listCreatableRoles, listStaff, listStaffPermissionOptions } from "@/lib/staff";
import type { CreatableRole, Staff, StaffPermissionOption } from "@/types/staff";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/staff">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Staff · ${site.name}` };
}

export default async function StaffPage({ params }: PageProps<"/site/[orgId]/staff">) {
  await requireOrganizationSite((await params).orgId);
  await requireSession();
  // The Staff page (`staff-list`): hidden (404) without View.
  const page = await getPagePermission("staff-list");
  if (!page) notFound();

  const token = await getAccessToken();
  let staff: Staff[] = [];
  let roles: CreatableRole[] = [];
  let permissionOptions: StaffPermissionOption[] = [];
  let loadError: string | undefined;
  try {
    // The role list is only needed (and only allowed) for Add / Edit.
    const canManage = page.add || page.edit;
    [staff, roles, permissionOptions] = await Promise.all([
      listStaff(token),
      canManage ? listCreatableRoles(token) : Promise.resolve([]),
      canManage ? listStaffPermissionOptions(token) : Promise.resolve([]),
    ]);
  } catch {
    loadError = "Could not load staff. Please try again.";
  }

  return <StaffTable staff={staff} roles={roles} permissionOptions={permissionOptions} canAdd={page.add} canEdit={page.edit} loadError={loadError} />;
}
