import type { FormField } from "@/components/form-modal/types";

// "Info" tab of the Edit Organization modal. Names match the organization table columns.
export const organizationInfoFields: FormField[] = [
  { name: "OrganizationName", label: "Organization Name", type: "text", width: "half", required: true, maxLength: 30, uppercase: true },
  { name: "OrganizationOwnerName", label: "Organization Owner", type: "text", placeholder: "NAME", span: 3, startRow: true, required: true, maxLength: 30, uppercase: true },
  {
    name: "OrganizationMobile",
    label: "Mobile",
    type: "tel",
    placeholder: "MOBILE",
    span: 2,
    required: true,
    maxLength: 10,
    validate: (value) => (/^\d{10}$/.test(value) ? undefined : "Mobile must be 10 digits"),
  },
  { name: "OrganizationAddress", label: "Address", type: "text", placeholder: "ADDRESS", span: 2, required: true, maxLength: 60, uppercase: true },
  { name: "OrganizationTheme", label: "Theme", type: "select", span: 2, options: [{ label: "Green", value: "Green" }] },
  { name: "OrganizationAppAccess", label: "App Access", type: "select", span: 2, options: [{ label: "DYNAMIC", value: "0" }] },
];
