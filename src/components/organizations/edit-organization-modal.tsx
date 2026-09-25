"use client";

import { TabbedModal } from "@/components/tabbed-modal";
import type { Organization } from "@/types/organization";
import { OrganizationInfoTab } from "./organization-info-tab";

type EditOrganizationModalProps = {
  organization: Organization | null;
  onClose: () => void;
  /** Called after a tab saves successfully. */
  onSaved: () => void;
};

export function EditOrganizationModal({ organization, onClose, onSaved }: EditOrganizationModalProps) {
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
            <OrganizationInfoTab key={organization.OrganizationId} organizationId={organization.OrganizationId} onSaved={onSaved} />
          ),
        },
        { value: "sms", label: "Sms" },
        { value: "domain", label: "Domain" },
        { value: "config", label: "Config" },
        // { value: "telegram", label: "Telegram" },
        { value: "salary", label: "Salary" },
        { value: "licence", label: "Licence" },
        { value: "status", label: "Active/Deactive" },
      ]}
    />
  );
}
