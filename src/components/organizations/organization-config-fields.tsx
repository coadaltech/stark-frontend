import type { FormField, TextField } from "@/components/form-modal/types";
import { ORGANIZATION_CONFIG_KEYS } from "@/types/organization";
import { saveSlot, type OrganizationTabConfig } from "./organization-settings-tab";

// "Config" tab of the Edit Organization modal. Every field maps 1:1 to an organization column of
// the same name; the API validates the same values and ranges.

const check = (name: string, label: string, startRow = false): FormField => ({
  name,
  label,
  type: "checkbox",
  compact: true,
  span: 3,
  startRow,
});

const wholeNumber = (name: string, label: string, min: number, max: number, startRow = false): TextField => ({
  name,
  label,
  type: "text",
  inputMode: "numeric",
  align: "right",
  span: 3,
  startRow,
  required: true,
  maxLength: String(max).length,
  validate: (value) => {
    const n = Number(value);
    return /^\d+$/.test(value) && n >= min && n <= max ? undefined : `${label} must be a whole number from ${min} to ${max}`;
  },
});

/** Amount box + button; the Add Limit action has no backend yet, so the button does nothing. */
function AddLimit() {
  return (
    <div className="flex gap-[15px]">
      <input
        type="text"
        inputMode="decimal"
        aria-label="Add Limit amount"
        // Enter here must not submit the settings form.
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        className="h-[31px] min-w-0 flex-1 border border-[#ced4da] bg-white px-2.5 text-right text-[12.5px] font-semibold text-[#333] outline-none focus:border-[#e6c45b] focus:bg-[#fde8a0]"
      />
      <button
        type="button"
        className="h-[33px] w-[100px] shrink-0 rounded-[2px] bg-brand-save text-[13px] font-bold text-white hover:bg-brand-save-hover"
      >
        Add
      </button>
    </div>
  );
}

export const organizationConfigTab: OrganizationTabConfig = {
  fields: [
    check("IsEnableTazzaPatti", "Tazza Patti in Transaction"),
    check("IsMainJantriRoundOf", "Main Jantri Round Of"),
    check("IsCollectionJantriRoundOf", "Collection Jantri Round Of"),
    check("IsMultiplyUpMainJantri", "Show Up Main Jantri"),

    check("IsMultiplyUpCollection", "Show Up Collection Jantri", true),
    check("IsVoucherVerify", "Voucher Verify"),
    check("IsDashboardStaffGainerLooser", "Dashboard Gainer/Looser"),
    check("IsTransactionAlreadyExist", "Check Transaction Exist"),

    check("IsAutoUserNameForStaff", "Staff Auto UserName", true),
    check("UnPaidKistPopupForDashboard", "Kist On Dashboard"),
    {
      name: "IsBackLimitPopup",
      label: "Show Back Limit Popup",
      type: "select",
      span: 3,
      options: [
        { label: "Disable", value: "0" },
        { label: "Ledger All", value: "1" },
        { label: "Ledger Without HPT", value: "2" },
      ],
    },
    {
      name: "HissaNotApplyMode",
      label: "Hissa Not Apply Mode",
      type: "select",
      span: 3,
      options: [
        { label: "All Apply", value: "0" },
        { label: "Uttar No", value: "1" },
        { label: "Jantri No", value: "2" },
      ],
    },

    wholeNumber("VapsiWorkingDays", "Vapsi Work Days", 0, 365, true),
    wholeNumber("AbsentLedgerLockDays", "Absent Ledger Lock Days", 0, 365),

    { type: "heading", name: "roundOfValueHeading", label: "Round Of Value" },
    wholeNumber("RoundOffOnMainJantri", "Main Jantri Round", 1, 10000, true),
    wholeNumber("RoundOffOnCollection", "Collection Jantri Round", 1, 10000),
    saveSlot(3, { alignWithInputs: true }),

    { type: "heading", name: "shortkeyHeading", label: "Transaction Shortkey" },
    check("skey_Random_Old", "Random Old", true),
    check("skey_Crossing", "Crossing"),
    check("skey_FromTo", "From-To"),
    check("skey_Random_New", "Random New"),
    check("skey_OddEven", "Odd/Even", true),
    check("skey_EkdiDukdi", "Ekdi/Dukdi"),
    check("skey_Joda", "Joda"),
    check("skey_JodiDaane", "JodiDaane"),

    { type: "heading", name: "addLimitHeading", label: "Add Limit" },
    { type: "slot", name: "addLimit", span: 4, startRow: true, render: () => <AddLimit /> },
  ],
  toFormValues: (org) => Object.fromEntries(ORGANIZATION_CONFIG_KEYS.map((key) => [key, String(org[key])])),
  toUpdate: (values) => Object.fromEntries(ORGANIZATION_CONFIG_KEYS.map((key) => [key, Number(values[key])])),
};
