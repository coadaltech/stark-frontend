import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaffTable } from "@/components/staff/staff-table";
import { getAccessToken, requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { getPagePermission } from "@/lib/permissions";
import { listCreatableRoles, listStaff } from "@/lib/staff";
import type { CreatableRole, Staff } from "@/types/staff";

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
  let loadError: string | undefined;
  try {
    // The role list is only needed (and only allowed) for Add / Edit.
    [staff, roles] = await Promise.all([
      listStaff(token),
      page.add || page.edit ? listCreatableRoles(token) : Promise.resolve([]),
    ]);
  } catch {
    loadError = "Could not load staff. Please try again.";
  }

  return <StaffTable staff={staff} roles={roles} canAdd={page.add} canEdit={page.edit} loadError={loadError} />;
}
