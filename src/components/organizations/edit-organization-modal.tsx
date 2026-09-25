"use client";

import { TabbedModal } from "@/components/tabbed-modal";
import type { Organization } from "@/types/organization";
import { organizationDomainTab } from "./organization-domain-fields";
import { organizationInfoTab } from "./organization-info-fields";
import { OrganizationSettingsTab, type OrganizationTabConfig } from "./organization-settings-tab";
import { organizationSmsTab } from "./organization-sms-fields";

type EditOrganizationModalProps = {
  organization: Organization | null;
  onClose: () => void;
  /** Called after a tab saves successfully. */
  onSaved: () => void;
};

export function EditOrganizationModal({ organization, onClose, onSaved }: EditOrganizationModalProps) {
  const settingsTab = (config: OrganizationTabConfig) =>
    organization && (
      <OrganizationSettingsTab
        key={organization.OrganizationId}
        organizationId={organization.OrganizationId}
        config={config}
        onSaved={onSaved}
      />
    );

  return (
    <TabbedModal
      open={organization !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Edit Organization"
      tabs={[
        {
          value: "info",
          label: "Info",
          content: settingsTab(organizationInfoTab),
        },
        { value: "sms", label: "Sms", content: settingsTab(organizationSmsTab) },
        { value: "domain", label: "Domain", content: settingsTab(organizationDomainTab) },
        { value: "config", label: "Config" },
        // { value: "telegram", label: "Telegram" },
        { value: "salary", label: "Salary" },
        { value: "licence", label: "Licence" },
        { value: "status", label: "Active/Deactive" },
      ]}
    />
  );
}
