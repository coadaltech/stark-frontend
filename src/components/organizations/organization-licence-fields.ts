import type { OrganizationTabConfig } from "./organization-settings-tab";

// "Licence" tab of the Edit Organization modal: the organization's subscription period.
// Dates are "YYYY-MM-DD", so they compare correctly as strings. The API enforces the same rule.
export const organizationLicenceTab: OrganizationTabConfig = {
  saveSpan: 4,
  fields: [
    { name: "OrganizationStartDate", label: "Start Date", type: "date", span: 4, required: true },
    {
      name: "OrganizationEndDate",
      label: "End Date",
      type: "date",
      span: 4,
      required: true,
      validate: (value, values) =>
        values.OrganizationStartDate && value < values.OrganizationStartDate
          ? "End date cannot be before start date"
          : undefined,
    },
  ],
  toFormValues: (org) => ({
    OrganizationStartDate: org.OrganizationStartDate,
    OrganizationEndDate: org.OrganizationEndDate,
  }),
  toUpdate: (values) => ({
    OrganizationStartDate: values.OrganizationStartDate,
    OrganizationEndDate: values.OrganizationEndDate,
  }),
};
