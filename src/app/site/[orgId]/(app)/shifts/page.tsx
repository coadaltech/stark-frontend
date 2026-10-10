import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShiftTable } from "@/components/shifts/shift-table";
import { getAccessToken, requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { getPagePermission } from "@/lib/permissions";
import { listShiftRoles, listShifts } from "@/lib/shifts";
import type { Shift, ShiftRole } from "@/types/shift";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/shifts">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Shift · ${site.name}` };
}

export default async function ShiftsPage({ params }: PageProps<"/site/[orgId]/shifts">) {
  await requireOrganizationSite((await params).orgId);
  await requireSession();
  // The Shift page (`shift-list`): hidden (404) without View.
  const page = await getPagePermission("shift-list");
  if (!page) notFound();

  const token = await getAccessToken();
  let shifts: Shift[] = [];
  let roles: ShiftRole[] = [];
  let loadError: string | undefined;
  try {
    // The role list is only needed (and only allowed) for Add.
    [shifts, roles] = await Promise.all([listShifts(token), page.add ? listShiftRoles(token) : Promise.resolve([])]);
  } catch {
    loadError = "Could not load shifts. Please try again.";
  }

  return <ShiftTable shifts={shifts} roles={roles} canAdd={page.add} loadError={loadError} />;
}
