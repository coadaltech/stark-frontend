"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormValues } from "@/components/form-modal/types";
import { Modal } from "@/components/modal";
import { formatDateTime } from "@/lib/format";
import {
  createRolePermission,
  deleteRolePermission,
  updateRolePermission,
  type PermissionOptions,
  type RolePermission,
  type ViewType,
} from "@/lib/role-permissions";
import { cn } from "@/lib/utils";
import { chosenPage, flagsFromValues, flagValues, rolePermissionFields } from "./role-permission-fields";

const columns = [
  { label: "Sr", className: "w-[38px]" },
  { label: "Title", className: "w-[150px]" },
  { label: "Role", className: "w-[140px]" },
  { label: "Menu", className: "w-[90px]" },
  { label: "Sub-menu", className: "w-[90px]" },
  { label: "View", className: "w-[55px]" },
  { label: "Add", className: "w-[55px]" },
  { label: "Edit", className: "w-[55px]" },
  { label: "Delete", className: "w-[55px]" },
  { label: "Export", className: "w-[55px]" },
  { label: "ViewType", className: "w-[70px]" },
  { label: "Updated By", className: "w-[100px]" },
  { label: "Updated Date", className: "w-[145px]" },
  { label: "Action", className: "w-[110px]" },
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

const yesNo = (on: boolean) => (on ? "Yes" : "No");

type RolePermissionsTableProps = { permissions: RolePermission[]; options: PermissionOptions; loadError?: string };

/** Permissions → Role tab (spec §6.2): role permissions of roles below the signed-in user. */
export function RolePermissionsTable({ permissions, options, loadError }: RolePermissionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RolePermission | null>(null);
  const [deleting, setDeleting] = useState<RolePermission | null>(null);
  const [deleteState, setDeleteState] = useState<{ busy: boolean; error?: string }>({ busy: false });

  // F2 opens the Add modal (not while another modal is open).
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
    const page = chosenPage(options, values);
    await createRolePermission({
      Title: values.Title,
      RoleId: Number(values.RoleId),
      MenuId: Number(values.MenuId),
      SubMenuId: page?.subMenuId ?? null,
      ...flagsFromValues(values),
      ViewType: values.ViewType as ViewType,
    });
    router.refresh();
  }

  async function handleUpdate(values: FormValues) {
    if (!editing) return;
    await updateRolePermission(editing.RolePermissionId, {
      Title: values.Title,
      ...flagsFromValues(values),
      ViewType: values.ViewType as ViewType,
    });
    setEditing(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteState({ busy: true });
    try {
      await deleteRolePermission(deleting.RolePermissionId);
      setDeleting(null);
      setDeleteState({ busy: false });
      router.refresh();
    } catch (error) {
      setDeleteState({ busy: false, error: error instanceof Error ? error.message : "Could not delete the permission." });
    }
  }

  const query = search.trim().toLowerCase();
  const rows = query
    ? permissions.filter((p) =>
        [p.Title, p.RoleName, p.MenuLabel, p.SubMenuLabel ?? "", p.ViewType, p.UpdatedBy].some((v) => v.toLowerCase().includes(query)),
      )
    : permissions;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <label htmlFor="role-permission-search" className="text-xs font-bold text-[#555]">
          Search
        </label>
        <input
          id="role-permission-search"
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
        <table className="h-full w-full min-w-[1208px] border-separate border-spacing-0">
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
              rows.map((p, index) => (
                <tr
                  key={p.RolePermissionId}
                  className="h-[35.5px] text-[12.5px] font-semibold text-[#333] even:bg-brand-row-alt [&>td]:border-r [&>td]:border-b [&>td]:border-[#e4e7eb] [&>td]:px-2.5 [&>td:last-child]:border-r-0"
                >
                  <td>{index + 1}</td>
                  <td>{p.Title}</td>
                  <td>{p.RoleName}</td>
                  <td>{p.MenuLabel}</td>
                  <td>{p.SubMenuLabel ?? "-"}</td>
                  <td>{yesNo(p.IsPageAllow)}</td>
                  <td>{yesNo(p.Add)}</td>
                  <td>{yesNo(p.Edit)}</td>
                  <td>{yesNo(p.Delete)}</td>
                  <td>{yesNo(p.Export)}</td>
                  <td>{p.ViewType}</td>
                  <td>{p.UpdatedBy}</td>
                  <td>{formatDateTime(p.UpdatedDate)}</td>
                  <td className="space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      aria-label={`Edit: ${p.Title}`}
                      className="rounded-[2px] bg-brand-action px-2.5 py-[3px] text-[10.5px] text-white hover:bg-brand-nav-active"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteState({ busy: false });
                        setDeleting(p);
                      }}
                      aria-label={`Delete: ${p.Title}`}
                      className="rounded-[2px] bg-red-600 px-2.5 py-[3px] text-[10.5px] text-white hover:bg-red-700"
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
        title="Add Role Permission"
        fields={rolePermissionFields(options, permissions)}
        initialValues={{ IsPageAllow: "1", Export: "1", ViewType: "SELF" }}
        onSubmit={handleCreate}
      />
      <FormModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing ? `Edit Role Permission — ${editing.Title}` : "Edit Role Permission"}
        fields={editing ? rolePermissionFields(options, permissions, editing) : []}
        initialValues={
          editing
            ? {
                Title: editing.Title,
                MenuId: String(editing.MenuId),
                SubMenuId: editing.SubMenuId === null ? "" : String(editing.SubMenuId),
                RoleId: String(editing.RoleId),
                ViewType: editing.ViewType,
                ...flagValues(editing),
              }
            : undefined
        }
        onSubmit={handleUpdate}
      />
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Role Permission"
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
          Delete <span className="font-bold">{deleting?.Title}</span> ({deleting?.RoleName})? Staff restrictions on this permission are
          removed too.
        </p>
      </Modal>
    </div>
  );
}
