import type { OrganizationTabConfig } from "./organization-settings-tab";

// Bare host name, e.g. "lgaikhai.com" (the API applies the same rule and lower-cases it).
const DOMAIN_PATTERN = /^(?=.{1,100}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

// "Domain" tab of the Edit Organization modal. The API also checks the domain isn't used by another organization.
export const organizationDomainTab: OrganizationTabConfig = {
  saveSpan: 4,
  fields: [
    { name: "OrganizationOnDomain", label: "Domain ON - Tick Yes/No", type: "checkbox", width: "full" },
    {
      name: "OrganizationDomainURL",
      label: "Domain URL",
      type: "text",
      placeholder: "example.com",
      width: "full",
      maxLength: 100,
      requiredWhen: (values) => values.OrganizationOnDomain === "1",
      // validate: (value) =>
      //   DOMAIN_PATTERN.test(value) ? undefined : "Enter a domain like example.com (no http://, path or port)",
    },
  ],
  toFormValues: (org) => ({
    OrganizationOnDomain: String(org.OrganizationOnDomain),
    OrganizationDomainURL: org.OrganizationDomainURL,
  }),
  toUpdate: (values) => ({
    OrganizationOnDomain: values.OrganizationOnDomain === "1" ? 1 : 0,
    OrganizationDomainURL: values.OrganizationDomainURL.toLowerCase(),
  }),
};
