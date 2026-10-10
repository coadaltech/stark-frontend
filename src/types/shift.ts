// Mirrors GET /shifts (shifts of the signed-in organization site).
export type Shift = {
  ShiftId: number;
  ShiftName: string;
  /** Open Date, "YYYY-MM-DD". */
  ShiftDate: string;
  ShiftNextDay: "Yes" | "No";
  ShiftFor: "BOTH" | "WEB" | "APP";
  /** "1" active, "0" deactive. */
  IsActive: string;
  UpdatedBy: string;
  UpdatedDate: string; // ISO timestamp
};

/** A role that gets an end time in Add Shift (GET /shifts/roles). */
export type ShiftRole = { RoleId: number; RoleName: string };

export const SHIFT_FOR = [
  { value: "BOTH", label: "Both" },
  { value: "WEB", label: "Web" },
  { value: "APP", label: "App" },
] as const;
