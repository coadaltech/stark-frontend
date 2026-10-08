import type { FormField, FormValues } from "@/components/form-modal/types";
import type { Flags, PermissionOptions, StaffPermission, StaffPermissionInput } from "@/lib/role-permissions";

const ACTIONS: { flag: keyof Flags; label: string }[] = [
  { flag: "IsPageAllow", label: "View" },
  { flag: "Add", label: "Add" },
  { flag: "Edit", label: "Edit" },
  { flag: "Delete", label: "Delete" },
  { flag: "Export", label: "Export" },
];

/** Every page of the organization: PAGE menus and the sub-menus of GROUP menus, in nav order. */
export function permissionPages(options: PermissionOptions) {
  return options.menus.flatMap((m) =>
    m.MenuType === "PAGE"
      ? [{ MenuId: m.MenuId, SubMenuId: null as number | null, label: m.Label }]
      : m.SubMenus.map((s) => ({ MenuId: m.MenuId, SubMenuId: s.SubMenuId as number | null, label: `${m.Label} / ${s.Label}` })),
  );
}

const fieldName = (i: number, flag: keyof Flags) => `page${i}_${flag}`;

/**
 * Fields of the Add / Edit staff-permission modal: Title, then every page with its five actions.
 * Ticked = allowed (the person still needs their role to allow it too); a page's other actions are
 * disabled while its View is unticked.
 */
export function staffPermissionFields(options: PermissionOptions) {
  const pages = permissionPages(options);
  return (values: FormValues): FormField[] => [
    { name: "Title", label: "Title", type: "text", required: true, maxLength: 50, width: "half" },
    ...pages.flatMap((page, i): FormField[] => [
      { type: "heading", name: `page${i}`, label: page.label },
      ...ACTIONS.map(
        ({ flag, label }, k): FormField => ({
          name: fieldName(i, flag),
          label,
          type: "checkbox",
          compact: true,
          span: 2,
          startRow: k === 0,
          disabled: flag !== "IsPageAllow" && values[fieldName(i, "IsPageAllow")] !== "1",
        }),
      ),
    ]),
  ];
}

/**
 * Initial form values: a new staff permission starts with everything ticked (no limits); an existing
 * one shows its pages (a page it has no entry for is unlimited, so it shows ticked too).
 */
export function staffPermissionValues(options: PermissionOptions, existing?: StaffPermission): FormValues {
  const values: FormValues = { Title: existing?.Title ?? "" };
  permissionPages(options).forEach((page, i) => {
    const saved = existing?.Pages.find((p) => p.MenuId === page.MenuId && (p.SubMenuId ?? null) === page.SubMenuId);
    for (const { flag } of ACTIONS) values[fieldName(i, flag)] = !saved || saved[flag] ? "1" : "0";
  });
  return values;
}

/** Form values → API body (every page listed; with View off its other actions are off). */
export function staffPermissionInput(options: PermissionOptions, values: FormValues): StaffPermissionInput {
  return {
    Title: values.Title,
    Pages: permissionPages(options).map((page, i) => {
      const view = values[fieldName(i, "IsPageAllow")] === "1";
      const on = (flag: keyof Flags) => view && values[fieldName(i, flag)] === "1";
      return { MenuId: page.MenuId, SubMenuId: page.SubMenuId, IsPageAllow: view, Add: on("Add"), Edit: on("Edit"), Delete: on("Delete"), Export: on("Export") };
    }),
  };
}

/** "View, Add" for one page of a staff permission ("No access" without View). */
export function actionSummary(p: Flags) {
  if (!p.IsPageAllow) return "No access";
  return ACTIONS.filter(({ flag }) => p[flag]).map(({ label }) => label).join(", ");
}
