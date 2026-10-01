import { api } from "@/lib/api";
import type { CreatableRole, Staff } from "@/types/staff";

export type CreateStaffInput = {
  LoginName: string;
  LoginType: number;
  StaffWorkMode: number;
  UserName: string;
  Password: string;
  Mobile: string;
  Address: string;
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
