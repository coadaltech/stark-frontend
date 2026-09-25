import { api } from "@/lib/api";
import type { Organization, OrganizationDetail } from "@/types/organization";

export type CreateOrganizationInput = {
  OrganizationName: string;
  OrganizationOwnerName: string;
  OrganizationMobile: string;
  OrganizationAddress: string;
  OrganizationTheme: string;
};

/** Any subset of editable fields; each Edit tab sends only its own. */
export type UpdateOrganizationInput = Partial<
  CreateOrganizationInput &
    Pick<
      OrganizationDetail,
      | "OrganizationAppAccess"
      | "OrganizationSms"
      | "OrganizationSmsUrl"
      | "OrganizationSmsUsername"
      | "OrganizationSmsPassword"
      | "OrganizationSmsSenderId"
      | "OrganizationSmsPort"
      | "OrganizationOnDomain"
      | "OrganizationDomainURL"
    >
>;

export function listOrganizations() {
  return api<Organization[]>("/organizations", { cache: "no-store" });
}

export function getOrganization(id: number) {
  return api<OrganizationDetail>(`/organizations/${id}`, { cache: "no-store" });
}

export function createOrganization(input: CreateOrganizationInput) {
  return api<Organization>("/organizations", { method: "POST", body: JSON.stringify(input) });
}

export function updateOrganization(id: number, input: UpdateOrganizationInput) {
  return api<OrganizationDetail>(`/organizations/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
