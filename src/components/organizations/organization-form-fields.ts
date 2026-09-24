import type { FormField } from "@/components/form-modal/types";

// Names match the organization / login table columns the backend will write.
export const organizationFormFields: FormField[] = [
  { name: "OrganizationName", label: "Organization Name", type: "text", width: "half", required: true, maxLength: 30, uppercase: true },
  { name: "OrganizationOwnerName", label: "Owner Account", type: "text", placeholder: "NAME", required: true, maxLength: 30, uppercase: true, startRow: true },
  { name: "UserName", label: "Username", type: "text", placeholder: "USERNAME", required: true, maxLength: 30, uppercase: true },
  { name: "Password", label: "Password", type: "password", placeholder: "PASSWORD", required: true, maxLength: 30 },
  {
    name: "OrganizationMobile",
    label: "Mobile",
    type: "tel",
    placeholder: "MOBILE",
    required: true,
    maxLength: 10,
    validate: (value) => (/^\d{10}$/.test(value) ? undefined : "Mobile must be 10 digits"),
  },
  { name: "OrganizationAddress", label: "Address", type: "text", placeholder: "ADDRESSS", required: true, maxLength: 60, uppercase: true },
  { name: "OrganizationTheme", label: "Theme", type: "select", options: [{ label: "Green", value: "Green" }] },
];
