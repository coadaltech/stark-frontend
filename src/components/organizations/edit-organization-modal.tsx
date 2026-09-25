"use client";

import { TabbedModal } from "@/components/tabbed-modal";
import type { Organization } from "@/types/organization";
import { organizationConfigTab } from "./organization-config-fields";
import { organizationDomainTab } from "./organization-domain-fields";
import { organizationInfoTab } from "./organization-info-fields";
import { organizationLicenceTab } from "./organization-licence-fields";
import { OrganizationSalaryTab } from "./organization-salary-tab";
import { OrganizationStatusTab } from "./organization-status-tab";
import { OrganizationSettingsTab, type OrganizationTabConfig } from "./organization-settings-tab";
import { organizationSmsTab } from "./organization-sms-fields";
import { organizationTelegramTab } from "./organization-telegram-fields";

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
        { value: "config", label: "Config", content: settingsTab(organizationConfigTab) },
        { value: "telegram", label: "Telegram", content: settingsTab(organizationTelegramTab) },
        {
          value: "salary",
          label: "Salary",
          content: organization && (
            <OrganizationSalaryTab key={organization.OrganizationId} organizationId={organization.OrganizationId} />
          ),
        },
        { value: "licence", label: "Licence", content: settingsTab(organizationLicenceTab) },
        {
          value: "status",
          label: "Active/Deactive",
          content: organization && (
            <OrganizationStatusTab key={organization.OrganizationId} organizationId={organization.OrganizationId} />
          ),
        },
      ]}
    />
  );
}
