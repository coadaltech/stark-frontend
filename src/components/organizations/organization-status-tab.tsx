"use client";

import { useState } from "react";
import { updateOrganization } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { OrganizationDetailLoader } from "./organization-detail-loader";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; active: boolean } | { kind: "error"; message: string };

/** "Active/Deactive" tab: loads the current state, then toggles it. */
export function OrganizationStatusTab({ organizationId }: { organizationId: number }) {
  return (
    <OrganizationDetailLoader organizationId={organizationId}>
      {(org) => <StatusToggle organizationId={organizationId} initiallyActive={org.IsOrganizationAllow === "1"} />}
    </OrganizationDetailLoader>
  );
}

function StatusToggle({ organizationId, initiallyActive }: { organizationId: number; initiallyActive: boolean }) {
  const [active, setActive] = useState(initiallyActive);
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function toggle() {
    const next = !active;
    setStatus({ kind: "saving" });
    try {
      // The remark is only collected for now; it is not stored anywhere yet.
      await updateOrganization(organizationId, { IsOrganizationAllow: next ? "1" : "0" });
      setActive(next);
      setStatus({ kind: "saved", active: next });
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
      <div className="col-span-12 sm:col-span-4">
        <label htmlFor="organization-status-remark" className="mb-2 block text-[13px] text-[#333]">
          Remark
        </label>
        <input
          id="organization-status-remark"
          type="text"
          value={remark}
          maxLength={200}
          onChange={(e) => setRemark(e.target.value)}
          className="h-[31px] w-full border border-[#ced4da] bg-white px-2.5 text-[12.5px] font-semibold text-[#333] outline-none focus:border-[#e6c45b] focus:bg-[#fde8a0]"
        />
      </div>
      <div className="col-span-12 sm:col-span-4 sm:col-start-1">
        <button
          type="button"
          onClick={toggle}
          disabled={status.kind === "saving"}
          aria-describedby="organization-status-message"
          title={active ? "Click to deactivate this organization" : "Click to activate this organization"}
          className={cn(
            "h-[33px] w-full rounded-[2px] text-[13px] font-bold text-white disabled:cursor-wait disabled:opacity-60",
            active ? "bg-brand-save hover:bg-brand-save-hover" : "bg-red-600 hover:bg-red-700",
          )}
        >
          {status.kind === "saving" ? "Saving…" : active ? "Now is Active" : "Now is Deactive"}
        </button>
        <p
          id="organization-status-message"
          role={status.kind === "error" ? "alert" : "status"}
          className={cn("mt-1 min-h-4 text-[12px]", status.kind === "error" ? "font-semibold text-red-600" : "text-[#888]")}
        >
          {status.kind === "saved"
            ? status.active
              ? "Organization activated."
              : "Organization deactivated."
            : status.kind === "error"
              ? status.message
              : ""}
        </p>
      </div>
    </div>
  );
}
