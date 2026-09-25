"use client";

import { EntityForm } from "@/components/form-modal/entity-form";
import type { FormField, FormSlotState, FormValues, SlotField } from "@/components/form-modal/types";
import { updateOrganization, type UpdateOrganizationInput } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import type { OrganizationDetail } from "@/types/organization";
import { OrganizationDetailLoader } from "./organization-detail-loader";

/** Describes one Edit Organization tab: its fields and how they map to/from the API. */
export type OrganizationTabConfig = {
  fields: FormField[];
  toFormValues: (organization: OrganizationDetail) => FormValues;
  /** Only the fields this tab owns; sent as a partial PATCH. */
  toUpdate: (values: FormValues) => UpdateOrganizationInput;
  /** Width of the Save button in grid columns (of 12). */
  saveSpan?: 3 | 4;
};

const SAVE_SLOT = "__save";

function SaveButton({ submitting }: Pick<FormSlotState, "submitting">) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="h-[33px] w-full rounded-[2px] bg-brand-save text-[13px] font-bold text-white hover:bg-brand-save-hover disabled:opacity-60"
    >
      {submitting ? "Saving…" : "Save"}
    </button>
  );
}

/**
 * Places the tab's Save button inside the field grid (instead of below the fields).
 * `alignWithInputs` pads it down so it lines up with inputs that have a label above them.
 */
export function saveSlot(span: 3 | 4, { alignWithInputs = false } = {}): SlotField {
  return {
    type: "slot",
    name: SAVE_SLOT,
    span,
    render: ({ submitting, error }) => (
      <div className={cn(alignWithInputs && "pt-[27px]")}>
        <SaveButton submitting={submitting} />
        {error && (
          <p role="alert" className="mt-1 text-[12.5px] font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>
    ),
  };
}

type OrganizationSettingsTabProps = {
  organizationId: number;
  config: OrganizationTabConfig;
  onSaved: () => void;
};

/** Loads the organization, then edits the subset of its settings described by `config`. */
export function OrganizationSettingsTab({ organizationId, config, onSaved }: OrganizationSettingsTabProps) {
  const saveSpan = config.saveSpan ?? 3;
  const hasSaveSlot = config.fields.some((field) => field.type === "slot" && field.name === SAVE_SLOT);

  return (
    <OrganizationDetailLoader organizationId={organizationId}>
      {(organization) => (
        <EntityForm
          fields={config.fields}
          initialValues={config.toFormValues(organization)}
          onSubmit={async (values) => {
            await updateOrganization(organizationId, config.toUpdate(values));
          }}
          onSuccess={onSaved}
          renderActions={
            hasSaveSlot
              ? undefined
              : ({ submitting, error }) => (
                  <div className="mt-4 grid grid-cols-12 items-center gap-x-[15px]">
                    <div className={cn("col-span-12", saveSpan === 4 ? "sm:col-span-4" : "sm:col-span-3")}>
                      <SaveButton submitting={submitting} />
                    </div>
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
                )
          }
        />
      )}
    </OrganizationDetailLoader>
  );
}
