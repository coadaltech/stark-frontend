"use client";

import { AutoSaveCheckbox } from "@/components/auto-save-checkbox";
import { updateOrganization } from "@/lib/organizations";
import { OrganizationDetailLoader } from "./organization-detail-loader";

const salarySettings = [
  { name: "IsAutoSalaryCreate", label: "Auto Salary Create" },
  { name: "IsAutoSalaryPaid", label: "Auto Salary Paid" },
] as const;

/** "Salary" tab: each checkbox saves its own column as soon as it is toggled. */
export function OrganizationSalaryTab({ organizationId }: { organizationId: number }) {
  return (
    <OrganizationDetailLoader organizationId={organizationId}>
      {(org) => (
        <div className="grid grid-cols-12 gap-x-[15px]">
          {salarySettings.map(({ name, label }) => (
            <AutoSaveCheckbox
              key={name}
              label={label}
              defaultChecked={org[name] === 1}
              onSave={async (checked) => {
                await updateOrganization(organizationId, { [name]: checked ? 1 : 0 });
              }}
              className="col-span-12 sm:col-span-3"
            />
          ))}
        </div>
      )}
    </OrganizationDetailLoader>
  );
}
