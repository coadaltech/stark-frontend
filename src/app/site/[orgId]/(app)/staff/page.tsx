import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaffTable } from "@/components/staff/staff-table";
import { getAccessToken, requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { canManageStaff } from "@/lib/roles";
import { listCreatableRoles, listStaff } from "@/lib/staff";
import type { CreatableRole, Staff } from "@/types/staff";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/staff">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Staff · ${site.name}` };
}

export default async function StaffPage({ params }: PageProps<"/site/[orgId]/staff">) {
  await requireOrganizationSite((await params).orgId);
  const user = await requireSession();
  if (!canManageStaff(user.roleId)) notFound();

  const token = await getAccessToken();
  let staff: Staff[] = [];
  let roles: CreatableRole[] = [];
  let loadError: string | undefined;
  try {
    [staff, roles] = await Promise.all([listStaff(token), listCreatableRoles(token)]);
  } catch {
    loadError = "Could not load staff. Please try again.";
  }

  return <StaffTable staff={staff} roles={roles} loadError={loadError} />;
}
