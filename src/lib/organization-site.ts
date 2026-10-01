import { api } from "@/lib/api";

export type OrganizationInfo = { organizationId: number; name: string; totalStaff: number };

/** Server only: the signed-in site's organization (name, id, total staff). */
export function getOrganizationInfo(token: string | undefined) {
  return api<OrganizationInfo>("/site/organization-info", { cache: "no-store", token });
}
