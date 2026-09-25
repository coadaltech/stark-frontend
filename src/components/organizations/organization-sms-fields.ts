import type { FormValues } from "@/components/form-modal/types";
import type { OrganizationTabConfig } from "./organization-settings-tab";

const smsOn = (values: FormValues) => values.OrganizationSms === "1";

// "Sms" tab of the Edit Organization modal. Connection fields are required only while SMS is on
// (the API enforces the same rule).
export const organizationSmsTab: OrganizationTabConfig = {
  saveSpan: 4,
  fields: [
    { name: "OrganizationSms", label: "SMS - Tick Yes/No (All Sms will start or stop.)", type: "checkbox", width: "full" },
    {
      name: "OrganizationSmsUrl",
      label: "SMS URL",
      type: "text",
      span: 4,
      startRow: true,
      maxLength: 100,
      requiredWhen: smsOn,
      validate: (value) => (/^https?:\/\/\S+$/i.test(value) ? undefined : "SMS URL must start with http:// or https://"),
    },
    { name: "OrganizationSmsUsername", label: "SMS Username", type: "text", span: 2, maxLength: 30, requiredWhen: smsOn },
    { name: "OrganizationSmsPassword", label: "SMS Password", type: "password", span: 2, maxLength: 30, requiredWhen: smsOn },
    { name: "OrganizationSmsSenderId", label: "SMS Sender Id", type: "text", span: 2, maxLength: 10, requiredWhen: smsOn },
    {
      name: "OrganizationSmsPort",
      label: "SMS Port",
      type: "text",
      span: 2,
      maxLength: 10,
      requiredWhen: smsOn,
      validate: (value) => {
        const port = Number(value);
        return /^\d+$/.test(value) && port >= 1 && port <= 65535 ? undefined : "SMS port must be a number from 1 to 65535";
      },
    },
  ],
  toFormValues: (org) => ({
    OrganizationSms: org.OrganizationSms,
    OrganizationSmsUrl: org.OrganizationSmsUrl,
    OrganizationSmsUsername: org.OrganizationSmsUsername,
    OrganizationSmsPassword: org.OrganizationSmsPassword,
    OrganizationSmsSenderId: org.OrganizationSmsSenderId,
    OrganizationSmsPort: org.OrganizationSmsPort,
  }),
  toUpdate: (values) => ({
    OrganizationSms: values.OrganizationSms === "1" ? "1" : "0",
    OrganizationSmsUrl: values.OrganizationSmsUrl,
    OrganizationSmsUsername: values.OrganizationSmsUsername,
    OrganizationSmsPassword: values.OrganizationSmsPassword,
    OrganizationSmsSenderId: values.OrganizationSmsSenderId,
    OrganizationSmsPort: values.OrganizationSmsPort,
  }),
};
