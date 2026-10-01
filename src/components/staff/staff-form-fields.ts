import type { FormField } from "@/components/form-modal/types";
import { WORK_MODES, type CreatableRole } from "@/types/staff";

// Usernames: letters, digits, ".", "_", "-" (the API applies the same rule).
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{1,30}$/;

/** The "Staff" (Add Staff) modal; names match the API body. Role lists only the roles the user may give. */
export function staffFormFields(roles: CreatableRole[]): FormField[] {
  return [
    { name: "LoginName", label: "Staff Name", type: "text", placeholder: "NAME", required: true, maxLength: 70, uppercase: true },
    {
      name: "LoginType",
      label: "Role",
      type: "select",
      required: true,
      options: [{ label: "Select Role", value: "" }, ...roles.map((r) => ({ label: r.roleName, value: String(r.roleId) }))],
    },
    {
      name: "StaffWorkMode",
      label: "W-Mode",
      type: "select",
      options: WORK_MODES.map((m) => ({ label: m.label, value: String(m.value) })),
    },
    {
      name: "UserName",
      label: "Username",
      type: "text",
      placeholder: "USERNAME",
      required: true,
      maxLength: 30,
      startRow: true,
      validate: (value) =>
        USERNAME_PATTERN.test(value) ? undefined : "Use letters, digits, '.', '_' or '-' (no spaces)",
    },
    { name: "Password", label: "Password", type: "password", placeholder: "PASSWORD", required: true, maxLength: 72 },
    {
      name: "Mobile",
      label: "Mobile",
      type: "tel",
      placeholder: "MOBILE",
      required: true,
      maxLength: 10,
      inputMode: "numeric",
      validate: (value) => (/^\d{10}$/.test(value) ? undefined : "Mobile must be 10 digits"),
    },
    { name: "Address", label: "Address", type: "text", placeholder: "ADDRESS", maxLength: 50, uppercase: true, width: "full" },
  ];
}
