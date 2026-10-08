"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormValues } from "@/components/form-modal/types";
import { Modal } from "@/components/modal";
import { formatDateTime } from "@/lib/format";
import {
  createStaffPermission,
  deleteStaffPermission,
  updateStaffPermission,
  type PermissionOptions,
  type StaffPermission,
} from "@/lib/role-permissions";
import { cn } from "@/lib/utils";
import { actionSummary, staffPermissionFields, staffPermissionInput, staffPermissionValues } from "./staff-permission-fields";

const columns = [
  { label: "Sr", className: "w-[38px]" },
  { label: "Title", className: "w-[200px]" },
  { label: "Pages", className: "w-[400px]" },
  { label: "Staff", className: "w-[70px]" },
  { label: "Updated By", className: "w-[120px]" },
  { label: "Updated Date", className: "w-[160px]" },
  { label: "Action", className: "w-[120px]" },
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

const USED_ABOVE = "Used by staff at or above your role";

type StaffPermissionsTableProps = { staffPermissions: StaffPermission[]; options: PermissionOptions; loadError?: string };

/**
 * Permissions → Staff tab: named staff permissions (unique titles) that can be assigned to staff in
 * Add / Edit Staff. A person's action needs their role permission AND their staff permission.
 */
export function StaffPermissionsTable({ staffPermissions, options, loadError }: StaffPermissionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<StaffPermission | null>(null);
  const [deleting, setDeleting] = useState<StaffPermission | null>(null);
  const [deleteState, setDeleteState] = useState<{ busy: boolean; error?: string }>({ busy: false });

  // F2 opens the Add modal (not while another modal is open). Both tabs stay mounted only while
  // active, so this listener exists only on the Staff tab.
  const busy = editing !== null || deleting !== null;
  useEffect(() => {
    if (busy) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        setAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy]);

  async function handleCreate(values: FormValues) {
    await createStaffPermission(staffPermissionInput(options, values));
    router.refresh();
  }

  async function handleUpdate(values: FormValues) {
    if (!editing) return;
    await updateStaffPermission(editing.StaffPermissionId, staffPermissionInput(options, values));
    setEditing(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteState({ busy: true });
    try {
      await deleteStaffPermission(deleting.StaffPermissionId);
      setDeleting(null);
      setDeleteState({ busy: false });
      router.refresh();
    } catch (error) {
      setDeleteState({ busy: false, error: error instanceof Error ? error.message : "Could not delete the staff permission." });
    }
  }

  const pagesText = (sp: StaffPermission) =>
    sp.Pages.length === 0
      ? "No limits"
      : sp.Pages.map((p) => `${p.SubMenuLabel ? `${p.MenuLabel} / ${p.SubMenuLabel}` : p.MenuLabel}: ${actionSummary(p)}`).join(" · ");

  const query = search.trim().toLowerCase();
  const rows = query
    ? staffPermissions.filter((sp) => [sp.Title, pagesText(sp), sp.UpdatedBy].some((v) => v.toLowerCase().includes(query)))
    : staffPermissions;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <label htmlFor="staff-permission-search" className="text-xs font-bold text-[#555]">
          Search
        </label>
        <input
          id="staff-permission-search"
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
        <table className="h-full w-full min-w-[1108px] border-separate border-spacing-0">
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
              rows.map((sp, index) => (
                <tr
                  key={sp.StaffPermissionId}
                  className="h-[35.5px] text-[12.5px] font-semibold text-[#333] even:bg-brand-row-alt [&>td]:border-r [&>td]:border-b [&>td]:border-[#e4e7eb] [&>td]:px-2.5 [&>td:last-child]:border-r-0"
                >
                  <td>{index + 1}</td>
                  <td>{sp.Title}</td>
                  <td>{pagesText(sp)}</td>
                  <td>{sp.AssignedCount}</td>
                  <td>{sp.UpdatedBy}</td>
                  <td>{formatDateTime(sp.UpdatedDate)}</td>
                  <td className="space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditing(sp)}
                      disabled={!sp.CanEdit}
                      title={sp.CanEdit ? undefined : USED_ABOVE}
                      aria-label={`Edit: ${sp.Title}`}
                      className="rounded-[2px] bg-brand-action px-2.5 py-[3px] text-[10.5px] text-white hover:bg-brand-nav-active disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteState({ busy: false });
                        setDeleting(sp);
                      }}
                      disabled={!sp.CanEdit}
                      title={sp.CanEdit ? undefined : USED_ABOVE}
                      aria-label={`Delete: ${sp.Title}`}
                      className="rounded-[2px] bg-red-600 px-2.5 py-[3px] text-[10.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete
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
        title="Add Staff Permission"
        fields={staffPermissionFields(options)}
        initialValues={staffPermissionValues(options)}
        onSubmit={handleCreate}
      />
      <FormModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing ? `Edit Staff Permission — ${editing.Title}` : "Edit Staff Permission"}
        fields={staffPermissionFields(options)}
        initialValues={editing ? staffPermissionValues(options, editing) : undefined}
        onSubmit={handleUpdate}
      />
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Staff Permission"
        footer={
          <>
            {deleteState.error && (
              <p role="alert" className="mr-auto text-[12.5px] font-semibold text-red-600">
                {deleteState.error}
              </p>
            )}
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteState.busy}
              className="h-[33px] rounded-[3px] bg-red-600 px-3 text-[13px] font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleteState.busy ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="h-[33px] rounded-[3px] px-3 text-[13px] font-bold text-[#333] hover:bg-[#f2f2f2]"
            >
              Cancel
            </button>
          </>
        }
      >
        <p className="px-[15px] py-5 text-[13px] text-[#333]">
          Delete <span className="font-bold">{deleting?.Title}</span>?{" "}
          {deleting && deleting.AssignedCount > 0
            ? `It is assigned to ${deleting.AssignedCount} staff member${deleting.AssignedCount === 1 ? "" : "s"}; they will have their role's permissions only.`
            : "It isn't assigned to anyone."}
        </p>
      </Modal>
    </div>
  );
}
