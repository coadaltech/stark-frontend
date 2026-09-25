import type { Metadata } from "next";
import { connection } from "next/server";
import { OrganizationsTable } from "@/components/organizations/organizations-table";
import { listOrganizations } from "@/lib/organizations";
import type { Organization } from "@/types/organization";

export const metadata: Metadata = { title: "Organizations · XYZ" };

export default async function OrganizationsPage() {
  // Always render at request time; the list changes as organizations are added.
  await connection();

  let organizations: Organization[] = [];
  let loadError: string | undefined;
  try {
    organizations = await listOrganizations();
  } catch {
    loadError = "Could not load organizations. Please check that the API is running.";
  }

  return <OrganizationsTable organizations={organizations} loadError={loadError} />;
}
