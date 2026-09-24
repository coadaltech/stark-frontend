"use client";

import { EntityForm } from "@/components/form-modal/entity-form";
import type { FormValues } from "@/components/form-modal/types";
import { TabbedModal } from "@/components/tabbed-modal";
import type { Organization } from "@/types/organization";
import { organizationInfoFields } from "./organization-info-fields";

type EditOrganizationModalProps = {
  organization: Organization | null;
  onClose: () => void;
};

export function EditOrganizationModal({ organization, onClose }: EditOrganizationModalProps) {
  async function handleSaveInfo(values: FormValues) {
    // TODO: PATCH /organizations/:id once the backend route exists.
    console.info("update organization", organization?.OrganizationId, values);
  }

  return (
    <TabbedModal
      open={organization !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Edit Organization"
      tabs={[
        {
          value: "info",
          label: "Info",
          content: organization && (
            <EntityForm
              key={organization.OrganizationId}
              fields={organizationInfoFields}
              // Theme / App Access aren't in the list data yet, so they start at their defaults.
              initialValues={{
                OrganizationName: organization.OrganizationName,
                OrganizationOwnerName: organization.OrganizationOwnerName,
                OrganizationMobile: organization.OrganizationMobile,
                OrganizationAddress: organization.OrganizationAddress,
              }}
              onSubmit={handleSaveInfo}
              onSuccess={onClose}
              renderActions={({ submitting, error }) => (
                <div className="mt-4 grid grid-cols-12 items-center gap-x-[15px]">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="col-span-12 h-[33px] rounded-[2px] bg-brand-save text-[13px] font-bold text-white hover:bg-brand-save-hover disabled:opacity-60 sm:col-span-3"
                  >
                    Save
                  </button>
                  {error && (
                    <p role="alert" className="col-span-12 text-[12.5px] font-semibold text-red-600 sm:col-span-9">
                      {error}
                    </p>
                  )}
                </div>
              )}
            />
          ),
        },
        { value: "sms", label: "Sms" },
        { value: "domain", label: "Domain" },
        { value: "config", label: "Config" },
        // { value: "telegram", label: "Telegram" },
        { value: "salary", label: "Salary" },
        // { value: "licence", label: "Licence" },
        { value: "status", label: "Active/Deactive" },
      ]}
    />
  );
}
