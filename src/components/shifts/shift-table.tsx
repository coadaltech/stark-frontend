"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormValues } from "@/components/form-modal/types";
import { formatDate, formatDateTime12 } from "@/lib/format";
import { createShift } from "@/lib/shifts";
import { cn } from "@/lib/utils";
import type { Shift, ShiftRole } from "@/types/shift";
import { endTimeField, shiftFormFields, todayIso } from "./shift-form-fields";

const columns = [
  { label: "Sr. No", className: "w-[70px]" },
  { label: "Shift Name", className: "w-[220px]" },
  { label: "Open Date", className: "w-[120px]" },
  { label: "Next Day", className: "w-[100px]" },
  { label: "Shift For", className: "w-[100px]" },
  { label: "IsActive", className: "w-[110px]" },
  { label: "Updated By", className: "w-[150px]" },
  { label: "Updated Date", className: "w-[190px]" },
  { label: "Action", className: "w-[90px]" },
];

function HeaderRow() {
  return (
    <tr>
      {columns.map((col) => (
        <th
          key={col.label}
          className={cn(
            "h-10 border-r border-white/30 bg-brand px-2.5 text-left text-[13px] font-bold whitespace-nowrap text-white last:border-r-0",
            col.className,
          )}
        >
          {col.label}
        </th>
      ))}
    </tr>
  );
}

const statusLabel = (s: Shift) => (s.IsActive === "1" ? "ACTIVE" : "DEACTIVE");

type ShiftTableProps = {
  shifts: Shift[];
  /** Roles that get an end time in Add Shift. */
  roles: ShiftRole[];
  /** Permission to add shifts (Add button, F2). */
  canAdd: boolean;
  loadError?: string;
};

/** Staff ▾ → Shift (specs/build/shifts/shift_spec.md §3): the organization's shifts and Add Shift. */
export function ShiftTable({ shifts, roles, canAdd, loadError }: ShiftTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  // F2 opens the Add modal, matching the button hint (only with Add permission).
  useEffect(() => {
    if (!canAdd) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        setAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canAdd]);

  async function handleCreate(values: FormValues) {
    await createShift({
      ShiftName: values.ShiftName,
      ShiftDate: values.ShiftDate,
      ShiftNextDay: values.ShiftNextDay === "Yes" ? "Yes" : "No",
      ShiftFor: values.ShiftFor as "BOTH" | "WEB" | "APP",
      Timings: roles.map((r) => ({ RoleId: r.RoleId, EndTime: values[endTimeField(r.RoleId)] ?? "" })),
    });
    router.refresh();
  }

  const query = search.trim().toLowerCase();
  const rows = query
    ? shifts.filter((s) =>
        [s.ShiftName, formatDate(s.ShiftDate), s.ShiftNextDay, s.ShiftFor, statusLabel(s), s.UpdatedBy].some((v) =>
          v.toLowerCase().includes(query),
        ),
      )
    : shifts;

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <h1 className="text-sm font-bold text-[#555]">Shift</h1>
        <label htmlFor="shift-search" className="ml-[34px] text-xs font-bold text-[#555]">
          Search
        </label>
        <input
          id="shift-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-5 h-[27px] w-[262px] border border-[#ccc] px-2 text-[13px] outline-none focus:border-brand-add"
        />
        {canAdd && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="ml-auto h-[31px] w-[120px] rounded-[2px] bg-brand-add text-[13px] font-bold text-white transition-colors hover:bg-brand-add-hover"
          >
            Add <span className="text-[10px] font-normal">(F2)</span>
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="h-full w-full min-w-[1150px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <HeaderRow />
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn("h-[140px] text-center text-[13px] font-semibold", loadError ? "text-red-600" : "text-[#888]")}
                >
                  {loadError ?? "No records found"}
                </td>
              </tr>
            ) : (
              rows.map((s, index) => (
                <tr
                  key={s.ShiftId}
                  className="h-[35.5px] text-[12.5px] font-semibold text-[#333] even:bg-brand-row-alt [&>td]:border-r [&>td]:border-b [&>td]:border-[#e4e7eb] [&>td]:px-2.5 [&>td:last-child]:border-r-0"
                >
                  <td>{index + 1}</td>
                  <td>{s.ShiftName}</td>
                  <td>{formatDate(s.ShiftDate)}</td>
                  <td>{s.ShiftNextDay}</td>
                  <td>{s.ShiftFor}</td>
                  <td>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-[2px] text-[10.5px] font-bold text-white",
                        s.IsActive === "1" ? "bg-brand-save" : "bg-red-600",
                      )}
                    >
                      {statusLabel(s)}
                    </span>
                  </td>
                  <td>{s.UpdatedBy}</td>
                  <td className="whitespace-nowrap">{formatDateTime12(s.UpdatedDate)}</td>
                  <td>
                    {/* Shown as in the legacy screen; wired up with Edit Shift (a later step). */}
                    <button
                      type="button"
                      aria-disabled="true"
                      title="Not available yet"
                      aria-label={`Action: ${s.ShiftName}`}
                      className="cursor-default rounded-[2px] bg-brand-action px-2.5 py-[3px] text-[10.5px] text-white"
                    >
                      Action
                    </button>
                  </td>
                </tr>
              ))
            )}
            {/* Absorbs spare height so the footer header stays at the bottom of the card. */}
            <tr aria-hidden="true" className="h-auto">
              <td colSpan={columns.length} className="p-0" />
            </tr>
          </tbody>
          <tfoot className="sticky bottom-0 z-10">
            <HeaderRow />
          </tfoot>
        </table>
      </div>

      <FormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Shift"
        fields={shiftFormFields(roles)}
        initialValues={{ ShiftDate: todayIso(), ShiftNextDay: "No", ShiftFor: "BOTH" }}
        onSubmit={handleCreate}
        className="w-[1030px]"
      />
    </section>
  );
}
