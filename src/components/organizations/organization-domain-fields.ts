import type { OrganizationTabConfig } from "./organization-settings-tab";

// Host name with an optional port, e.g. "lgaikhai.com" or "acme.localhost:3000" — it must equal the
// address the site is opened at. The API applies the same rule, lower-cases it and also rejects the
// main app's own host.
const DOMAIN_PATTERN =
  /^(?=[^:]{1,253}(?::|$))[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*(?::([0-9]{1,5}))?$/;

function domainError(value: string) {
  const match = DOMAIN_PATTERN.exec(value.trim().toLowerCase());
  const port = match?.[1];
  return match && (port === undefined || (Number(port) >= 1 && Number(port) <= 65535))
    ? undefined
    : "Enter a domain like example.com or acme.localhost:3000 (no http:// or path)";
}

// "Domain" tab of the Edit Organization modal. The API also checks the domain isn't used by another organization.
export const organizationDomainTab: OrganizationTabConfig = {
  saveSpan: 4,
  fields: [
    { name: "OrganizationOnDomain", label: "Domain ON - Tick Yes/No", type: "checkbox", width: "full" },
    {
      name: "OrganizationDomainURL",
      label: "Domain URL",
      type: "text",
      placeholder: "example.com or acme.localhost:3000",
      width: "full",
      maxLength: 100,
      requiredWhen: (values) => values.OrganizationOnDomain === "1",
      validate: domainError,
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
