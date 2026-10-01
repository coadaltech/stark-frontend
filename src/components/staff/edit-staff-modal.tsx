"use client";

import { useCallback, useState, type ReactNode } from "react";
import { DetailLoader } from "@/components/detail-loader";
import { EntityForm } from "@/components/form-modal/entity-form";
import type { FormField } from "@/components/form-modal/types";
import { saveSlot } from "@/components/organizations/organization-settings-tab";
import { TabbedModal } from "@/components/tabbed-modal";
import { getStaff, updateStaff } from "@/lib/staff";
import { cn } from "@/lib/utils";
import { WORK_MODES, withoutStaffSuffix, type CreatableRole, type Staff, type StaffDetail } from "@/types/staff";

type EditStaffModalProps = {
  staff: Staff | null;
  /** Roles the signed-in user may give (GET /staff/roles). */
  roles: CreatableRole[];
  onClose: () => void;
  /** Called after the Info tab saves (closes the modal). */
  onSaved: () => void;
  /** Called after the status changes (the modal stays open). */
  onChanged: () => void;
};

export function EditStaffModal({ staff, roles, onClose, onSaved, onChanged }: EditStaffModalProps) {
  const id = staff?.LoginId;
  // Stable per staff member, so each tab loads once when it opens.
  const load = useCallback(() => getStaff(id ?? 0), [id]);

  const tab = (render: (detail: StaffDetail) => ReactNode) =>
    staff && (
      <DetailLoader key={staff.LoginId} load={load} errorMessage="Could not load the staff member.">
        {(detail) =>
          detail.canEdit ? (
            render(detail)
          ) : (
            <p role="status" className="py-10 text-center text-[13px] font-semibold text-[#888]">
              You can only edit staff below your own role.
            </p>
          )
        }
      </DetailLoader>
    );

  return (
    <TabbedModal
      open={staff !== null}
      onOpenChange={(open) => !open && onClose()}
      title={staff ? `Edit Staff — ${staff.LoginName}` : "Edit Staff"}
      tabs={[
        { value: "info", label: "Info", content: tab((detail) => <StaffInfoForm detail={detail} roles={roles} onSaved={onSaved} />) },
        { value: "status", label: "Active/Deactive", content: tab((detail) => <StaffStatusToggle detail={detail} onChanged={onChanged} />) },
      ]}
    />
  );
}

function infoFields(detail: StaffDetail, roles: CreatableRole[]): FormField[] {
  // The current role stays selectable even if the editor couldn't give it (e.g. legacy roles).
  const roleOptions = roles.some((r) => r.roleId === detail.LoginType)
    ? roles
    : [{ roleId: detail.LoginType, roleName: detail.RoleName || `Role ${detail.LoginType}` }, ...roles];
  return [
    { name: "LoginName", label: "Staff Name", type: "text", placeholder: "NAME", required: true, maxLength: 70, uppercase: true },
    {
      name: "LoginType",
      label: "Role",
      type: "select",
      required: true,
      options: roleOptions.map((r) => ({ label: r.roleName, value: String(r.roleId) })),
    },
    {
      name: "StaffWorkMode",
      label: "W-Mode",
      type: "select",
      options: WORK_MODES.map((m) => ({ label: m.label, value: String(m.value) })),
    },
    {
      name: "Mobile",
      label: "Mobile",
      type: "tel",
      placeholder: "MOBILE",
      required: true,
      maxLength: 10,
      inputMode: "numeric",
      validate: (value) => (/^\d{10}$/.test(value) ? undefined : "Mobile must be 10 digits"),
    },
    { name: "Address", label: "Address", type: "text", placeholder: "ADDRESS", maxLength: 50, uppercase: true, width: "two-thirds" },
    { ...saveSlot(3), startRow: true },
  ];
}

/** "Info" tab: name, role, W-Mode, mobile, address. Username and password can't be changed here. */
function StaffInfoForm({ detail, roles, onSaved }: { detail: StaffDetail; roles: CreatableRole[]; onSaved: () => void }) {
  return (
    <div>
      <p className="mb-4 text-[12.5px] text-[#666]">
        Username <span className="font-semibold text-[#333]">{detail.UserName}</span>
      </p>
      <EntityForm
        fields={infoFields(detail, roles)}
        initialValues={{
          LoginName: withoutStaffSuffix(detail.LoginName),
          LoginType: String(detail.LoginType),
          StaffWorkMode: String(detail.StaffWorkMode),
          Mobile: detail.Mobile,
          Address: detail.Address,
        }}
        onSubmit={async (values) => {
          await updateStaff(detail.LoginId, {
            LoginName: values.LoginName,
            LoginType: Number(values.LoginType),
            StaffWorkMode: Number(values.StaffWorkMode),
            Mobile: values.Mobile,
            Address: values.Address,
          });
        }}
        onSuccess={onSaved}
      />
    </div>
  );
}

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; active: boolean } | { kind: "error"; message: string };

/** "Active/Deactive" tab: toggles the account; deactivating signs the staff member out everywhere. */
function StaffStatusToggle({ detail, onChanged }: { detail: StaffDetail; onChanged: () => void }) {
  const [active, setActive] = useState(detail.AccountStatus === "1");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function toggle() {
    const next = !active;
    setStatus({ kind: "saving" });
    try {
      await updateStaff(detail.LoginId, { AccountStatus: next ? "1" : "0" });
      setActive(next);
      setStatus({ kind: "saved", active: next });
      onChanged();
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof TypeError
            ? "Could not reach the server."
            : error instanceof Error
              ? error.message
              : "Could not change the status.",
      });
    }
  }

  return (
    <div className="grid grid-cols-12 gap-x-[15px] gap-y-4">
      <div className="col-span-12 sm:col-span-4 sm:col-start-1">
        <button
          type="button"
          onClick={toggle}
          disabled={status.kind === "saving"}
          aria-describedby="staff-status-message"
          title={active ? "Click to deactivate this staff member" : "Click to activate this staff member"}
          className={cn(
            "h-[33px] w-full rounded-[2px] text-[13px] font-bold text-white disabled:cursor-wait disabled:opacity-60",
            active ? "bg-brand-save hover:bg-brand-save-hover" : "bg-red-600 hover:bg-red-700",
          )}
        >
          {status.kind === "saving" ? "Saving…" : active ? "Now is Active" : "Now is Deactive"}
        </button>
        <p
          id="staff-status-message"
          role={status.kind === "error" ? "alert" : "status"}
          className={cn("mt-1 min-h-4 text-[12px]", status.kind === "error" ? "font-semibold text-red-600" : "text-[#888]")}
        >
          {status.kind === "saved"
            ? status.active
              ? "Staff member activated."
              : "Staff member deactivated and signed out everywhere."
            : status.kind === "error"
              ? status.message
              : ""}
        </p>
      </div>
    </div>
  );
}
