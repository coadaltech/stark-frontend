import type { FormField } from "@/components/form-modal/types";
import { SHIFT_FOR, type ShiftRole } from "@/types/shift";

/** Form field name of a role's end time (matches the API's field errors, e.g. "EndTime.7"). */
export const endTimeField = (roleId: number) => `EndTime.${roleId}`;

/** Today in the browser's local time, "YYYY-MM-DD" (the API re-checks with the organization's date). */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The "Add Shift" modal (specs/build/shifts/shift_spec.md §4): name, open date (today or later), Next Day
 * (ticked = Yes), Shift Working For, then an end time for each shift role — all required.
 */
export function shiftFormFields(roles: ShiftRole[]): FormField[] {
  return [
    { name: "ShiftName", label: "Shift Name", type: "text", required: true, maxLength: 50, uppercase: true, span: 4 },
    {
      name: "ShiftDate",
      label: "Open Date",
      type: "date",
      required: true,
      span: 3,
      validate: (value) => (value < todayIso() ? "Open date can't be before today" : undefined),
    },
    { name: "ShiftNextDay", label: "Next Day", type: "checkbox", checkedValue: "Yes", uncheckedValue: "No", compact: true, alignWithInputs: true, span: 2 },
    { name: "ShiftFor", label: "Shift Working For", type: "select", span: 3, options: SHIFT_FOR.map((s) => ({ label: s.label, value: s.value })) },
    ...roles.map(
      (role, i): FormField => ({ name: endTimeField(role.RoleId), label: role.RoleName, type: "time", required: true, span: 3, startRow: i === 0 }),
    ),
  ];
}
