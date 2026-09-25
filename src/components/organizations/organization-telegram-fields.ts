import type { FormValues } from "@/components/form-modal/types";
import type { OrganizationTabConfig } from "./organization-settings-tab";

const telegramAllowed = (values: FormValues) => values.TelegramAllow === "1";

// "Telegram" tab of the Edit Organization modal. URL and token are required only while
// Telegram is allowed (the API enforces the same rule).
export const organizationTelegramTab: OrganizationTabConfig = {
  saveSpan: 4,
  fields: [
    { name: "TelegramAllow", label: "Telegram Allow", type: "checkbox", width: "full" },
    {
      name: "TelegramUrl",
      label: "Telegram URL",
      type: "text",
      width: "full",
      maxLength: 250,
      requiredWhen: telegramAllowed,
      validate: (value) =>
        /^https?:\/\/\S+$/i.test(value) ? undefined : "Telegram URL must start with http:// or https://",
    },
    {
      name: "TelegramSession",
      label: "Access Token",
      type: "textarea",
      width: "full",
      rows: 6,
      maxLength: 10000,
      requiredWhen: telegramAllowed,
    },
  ],
  toFormValues: (org) => ({
    TelegramAllow: String(org.TelegramAllow),
    TelegramUrl: org.TelegramUrl,
    TelegramSession: org.TelegramSession,
  }),
  toUpdate: (values) => ({
    TelegramAllow: values.TelegramAllow === "1" ? 1 : 0,
    TelegramUrl: values.TelegramUrl,
    // Tokens never contain whitespace; drop spaces/line breaks picked up when copying.
    TelegramSession: values.TelegramSession.replace(/\s+/g, ""),
  }),
};
