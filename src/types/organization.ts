// Mirrors the columns of the "organization" table used by the list screen.
export type Organization = {
  OrganizationId: number;
  OrganizationName: string;
  OrganizationOwnerName: string;
  OrganizationMobile: string;
  OrganizationAddress: string;
  OrganizationStartDate: string; // ISO date
  OrganizationEndDate: string; // ISO date
  AddedBy: string;
  AddedDate: string; // ISO timestamp
};
