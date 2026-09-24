import { api } from "@/lib/api";
import type { Organization } from "@/types/organization";

export type CreateOrganizationInput = {
  OrganizationName: string;
  OrganizationOwnerName: string;
  OrganizationMobile: string;
  OrganizationAddress: string;
  OrganizationTheme: string;
};

export function listOrganizations() {
  return api<Organization[]>("/organizations", { cache: "no-store" });
}

export function createOrganization(input: CreateOrganizationInput) {
  return api<Organization>("/organizations", { method: "POST", body: JSON.stringify(input) });
}
