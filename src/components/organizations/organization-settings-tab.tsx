"use client";

import { useEffect, useState } from "react";
import { EntityForm } from "@/components/form-modal/entity-form";
import type { FormField, FormValues } from "@/components/form-modal/types";
import { getOrganization, updateOrganization, type UpdateOrganizationInput } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import type { OrganizationDetail } from "@/types/organization";

/** Describes one Edit Organization tab: its fields and how they map to/from the API. */
export type OrganizationTabConfig = {
  fields: FormField[];
  toFormValues: (organization: OrganizationDetail) => FormValues;
  /** Only the fields this tab owns; sent as a partial PATCH. */
  toUpdate: (values: FormValues) => UpdateOrganizationInput;
  /** Width of the Save button in grid columns (of 12). */
  saveSpan?: 3 | 4;
};

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: OrganizationDetail };

type OrganizationSettingsTabProps = {
  organizationId: number;
  config: OrganizationTabConfig;
  onSaved: () => void;
};

/** Loads the organization, then edits the subset of its settings described by `config`. */
export function OrganizationSettingsTab({ organizationId, config, onSaved }: OrganizationSettingsTabProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getOrganization(organizationId).then(
      (data) => !cancelled && setState({ status: "ready", data }),
      (error: unknown) =>
        !cancelled &&
        setState({
          status: "error",
          message:
            error instanceof TypeError
              ? "Could not reach the server."
              : error instanceof Error
                ? error.message
                : "Could not load the organization.",
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [organizationId, attempt]);

  if (state.status === "loading") {
    return <p className="py-10 text-center text-[13px] text-[#999]">Loading…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-[13px]">
        <p role="alert" className="font-semibold text-red-600">
          {state.message}
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="h-[31px] rounded-[2px] bg-brand-action px-4 font-bold text-white hover:bg-brand-nav-active"
        >
          Retry
        </button>
      </div>
    );
  }

  const saveSpan = config.saveSpan ?? 3;

  return (
    <EntityForm
      fields={config.fields}
      initialValues={config.toFormValues(state.data)}
      onSubmit={async (values) => {
        await updateOrganization(organizationId, config.toUpdate(values));
      }}
      onSuccess={onSaved}
      renderActions={({ submitting, error }) => (
        <div className="mt-4 grid grid-cols-12 items-center gap-x-[15px]">
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "col-span-12 h-[33px] rounded-[2px] bg-brand-save text-[13px] font-bold text-white hover:bg-brand-save-hover disabled:opacity-60",
              saveSpan === 4 ? "sm:col-span-4" : "sm:col-span-3",
            )}
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          {error && (
            <p
              role="alert"
              className={cn(
                "col-span-12 text-[12.5px] font-semibold text-red-600",
                saveSpan === 4 ? "sm:col-span-8" : "sm:col-span-9",
              )}
            >
              {error}
            </p>
          )}
        </div>
      )}
    />
  );
}
