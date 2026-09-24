import type { Metadata } from "next";
import { OrganizationsTable } from "@/components/organizations/organizations-table";

export const metadata: Metadata = { title: "Organizations · OrgStark" };

export default function OrganizationsPage() {
  // Rows come from the backend once the organizations API exists.
  return <OrganizationsTable organizations={[]} />;
}
