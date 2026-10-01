"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormValues } from "@/components/form-modal/types";
import { EditStaffModal } from "./edit-staff-modal";
import { staffFormFields } from "./staff-form-fields";
import { formatDateTime } from "@/lib/format";
import { createStaff } from "@/lib/staff";
import { cn } from "@/lib/utils";
import { workModeLabel, type CreatableRole, type Staff } from "@/types/staff";

const columns = [
  { label: "Sr", className: "w-[38px]" },
  { label: "Party Name", className: "w-[190px]" },
  { label: "Role", className: "w-[140px]" },
  { label: "Username", className: "w-[110px]" },
  { label: "W-Mode", className: "w-[80px]" },
  { label: "Mobile", className: "w-[100px]" },
  { label: "Address", className: "w-[110px]" },
  { label: "Agent", className: "w-[55px]" },
  { label: "Active", className: "w-[55px]" },
  { label: "Updated By", className: "w-[100px]" },
  { label: "Updated Date", className: "w-[150px]" },
  { label: "Action", className: "w-[70px]" },
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

type StaffTableProps = { staff: Staff[]; roles: CreatableRole[]; loadError?: string };

export function StaffTable({ staff, roles, loadError }: StaffTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  // F2 opens the Add modal, matching the button hint (not while editing).
  const isEditing = editing !== null;
  useEffect(() => {
    if (isEditing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        setAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditing]);

  async function handleCreate(values: FormValues) {
    await createStaff({
      LoginName: values.LoginName,
      LoginType: Number(values.LoginType),
      StaffWorkMode: Number(values.StaffWorkMode),
      UserName: values.UserName,
      Password: values.Password,
      Mobile: values.Mobile,
      Address: values.Address,
    });
    router.refresh();
  }

  const query = search.trim().toLowerCase();
  const rows = query
    ? staff.filter((s) =>
        [s.LoginName, s.RoleName, s.UserName, workModeLabel(s.StaffWorkMode), s.Mobile, s.Address, s.UpdatedBy].some(
          (value) => value.toLowerCase().includes(query),
        ),
      )
    : staff;

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <h1 className="text-sm font-bold text-[#555]">Staff</h1>
        <label htmlFor="staff-search" className="ml-[34px] text-xs font-bold text-[#555]">
          Search
        </label>
        <input
          id="staff-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-5 h-[27px] w-[262px] border border-[#ccc] px-2 text-[13px] outline-none focus:border-brand-add"
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="ml-auto h-[31px] w-[120px] rounded-[2px] bg-brand-add text-[13px] font-bold text-white transition-colors hover:bg-brand-add-hover"
        >
          Add <span className="text-[10px] font-normal">(F2)</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="h-full w-full min-w-[1198px] border-separate border-spacing-0">
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
                  key={s.LoginId}
                  className="h-[35.5px] text-[12.5px] font-semibold text-[#333] even:bg-brand-row-alt [&>td]:border-r [&>td]:border-b [&>td]:border-[#e4e7eb] [&>td]:px-2.5 [&>td:last-child]:border-r-0"
                >
                  <td>{index + 1}</td>
                  <td>{s.LoginName}</td>
                  <td>{s.RoleName}</td>
                  <td>{s.UserName}</td>
                  <td>{workModeLabel(s.StaffWorkMode)}</td>
                  <td>{s.Mobile}</td>
                  <td>{s.Address}</td>
                  <td>-</td>
                  <td>{s.AccountStatus === "1" ? "Yes" : "No"}</td>
                  <td>{s.UpdatedBy}</td>
                  <td>{formatDateTime(s.UpdatedDate)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setEditing(s)}
                      aria-label={`Action: ${s.UserName}`}
                      className="rounded-[2px] bg-brand-action px-2.5 py-[3px] text-[10.5px] text-white hover:bg-brand-nav-active"
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

      <FormModal open={addOpen} onOpenChange={setAddOpen} title="Staff" fields={staffFormFields(roles)} onSubmit={handleCreate} />
      <EditStaffModal
        staff={editing}
        roles={roles}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
        onChanged={() => router.refresh()}
      />
    </section>
  );
}
