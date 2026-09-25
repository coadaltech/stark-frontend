// Mirrors the columns of the "organization" table used by the list screen.
export type Organization = {
  OrganizationId: number;
  OrganizationName: string;
  OrganizationOwnerName: string;
  OrganizationMobile: string;
  OrganizationAddress: string;
  OrganizationStartDate: string; // ISO date
  OrganizationEndDate: string; // ISO date
  AddedBy: string;
  AddedDate: string; // ISO timestamp
};

// Full record returned by GET /organizations/:id (list fields + editable settings).
// Config tab settings; every one is a number (flags are 0/1, a few are small enums or counts).
export const ORGANIZATION_CONFIG_KEYS = [
  "IsEnableTazzaPatti",
  "IsMainJantriRoundOf",
  "IsCollectionJantriRoundOf",
  "IsMultiplyUpMainJantri",
  "IsMultiplyUpCollection",
  "IsVoucherVerify",
  "IsDashboardStaffGainerLooser",
  "IsTransactionAlreadyExist",
  "IsAutoUserNameForStaff",
  "UnPaidKistPopupForDashboard",
  "IsBackLimitPopup",
  "HissaNotApplyMode",
  "VapsiWorkingDays",
  "AbsentLedgerLockDays",
  "RoundOffOnMainJantri",
  "RoundOffOnCollection",
  "skey_Random_Old",
  "skey_Crossing",
  "skey_FromTo",
  "skey_Random_New",
  "skey_OddEven",
  "skey_EkdiDukdi",
  "skey_Joda",
  "skey_JodiDaane",
] as const;

export type OrganizationConfigKey = (typeof ORGANIZATION_CONFIG_KEYS)[number];
export type OrganizationConfig = Record<OrganizationConfigKey, number>;

export type OrganizationDetail = OrganizationConfig & Organization & {
  OrganizationTheme: string;
  OrganizationAppAccess: number;
  OrganizationSms: "0" | "1";
  OrganizationSmsUrl: string;
  OrganizationSmsUsername: string;
  OrganizationSmsPassword: string;
  OrganizationSmsSenderId: string;
  OrganizationSmsPort: string;
  OrganizationOnDomain: 0 | 1;
  OrganizationDomainURL: string;
  IsAutoSalaryCreate: number;
  IsAutoSalaryPaid: number;
  /** "1" = active (allowed), "0" = deactivated. */
  IsOrganizationAllow: "0" | "1";
  TelegramAllow: number;
  TelegramUrl: string;
  /** Telegram session string, shown on the Telegram tab as "Access Token". */
  TelegramSession: string;
};
