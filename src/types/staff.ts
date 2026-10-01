// Mirrors GET /staff (login rows of the signed-in organization site).
export type Staff = {
  LoginId: number;
  LoginName: string;
  LoginType: number;
  RoleName: string;
  UserName: string;
  StaffWorkMode: number;
  Mobile: string;
  Address: string;
  AccountStatus: string; // "1" active, "0" inactive
  UpdatedBy: string;
  UpdatedDate: string; // ISO timestamp
};

/** GET /staff/:id: a staff member plus whether the signed-in user may edit them (only below own role). */
export type StaffDetail = Staff & { canEdit: boolean };

/** A role the signed-in user may give to new staff (GET /staff/roles). */
export type CreatableRole = { roleId: number; roleName: string };

export const WORK_MODES = [
  { value: 0, label: "NONE" },
  { value: 1, label: "COMMAN" },
  { value: 2, label: "WHATSAPP" },
  { value: 3, label: "CALLING" },
] as const;

export const workModeLabel = (value: number) => WORK_MODES.find((m) => m.value === value)?.label ?? String(value);

/** Stored names end with this; the edit form shows the name without it. */
export const STAFF_NAME_SUFFIX = " STAFF A/C";
export const withoutStaffSuffix = (name: string) =>
  name.endsWith(STAFF_NAME_SUFFIX) ? name.slice(0, -STAFF_NAME_SUFFIX.length) : name;
