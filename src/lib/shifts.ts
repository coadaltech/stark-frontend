import { api } from "@/lib/api";
import type { Shift, ShiftRole } from "@/types/shift";

export type CreateShiftInput = {
  ShiftName: string;
  ShiftDate: string;
  ShiftNextDay: "Yes" | "No";
  ShiftFor: "BOTH" | "WEB" | "APP";
  /** One per shift role, 24-hour "HH:MM". */
  Timings: { RoleId: number; EndTime: string }[];
};

/** Server only: the signed-in organization site's shifts (oldest first). */
export function listShifts(token: string | undefined) {
  return api<Shift[]>("/shifts", { cache: "no-store", token });
}

/** Server only: the roles that get an end time, in form order. */
export function listShiftRoles(token: string | undefined) {
  return api<ShiftRole[]>("/shifts/roles", { cache: "no-store", token });
}

/** Browser: adds a shift. */
export function createShift(input: CreateShiftInput) {
  return api<Shift>("/shifts", { method: "POST", body: JSON.stringify(input) });
}
