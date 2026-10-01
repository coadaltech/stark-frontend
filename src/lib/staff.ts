import { api } from "@/lib/api";
import type { CreatableRole, Staff, StaffDetail } from "@/types/staff";

export type CreateStaffInput = {
  LoginName: string;
  LoginType: number;
  StaffWorkMode: number;
  UserName: string;
  Password: string;
  Mobile: string;
  Address: string;
};

/** Any subset of the editable fields; each Edit Staff tab sends only its own. */
export type UpdateStaffInput = Partial<Pick<CreateStaffInput, "LoginName" | "LoginType" | "StaffWorkMode" | "Mobile" | "Address">> & {
  AccountStatus?: "1" | "0";
};

/** Server only: the signed-in organization site's staff (newest first). */
export function listStaff(token: string | undefined) {
  return api<Staff[]>("/staff", { cache: "no-store", token });
}

/** Server only: roles the signed-in user may give to new staff. */
export function listCreatableRoles(token: string | undefined) {
  return api<CreatableRole[]>("/staff/roles", { cache: "no-store", token });
}

/** Browser: adds a staff member to the signed-in organization site. */
export function createStaff(input: CreateStaffInput) {
  return api<Staff>("/staff", { method: "POST", body: JSON.stringify(input) });
}

/** Browser: one staff member, with whether the signed-in user may edit them. */
export function getStaff(id: number) {
  return api<StaffDetail>(`/staff/${id}`, { cache: "no-store" });
}

/** Browser: edits a staff member (only staff below the signed-in user's role). */
export function updateStaff(id: number, input: UpdateStaffInput) {
  return api<Staff>(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
