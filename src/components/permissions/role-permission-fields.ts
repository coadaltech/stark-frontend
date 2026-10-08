import type { FormField, FormValues } from "@/components/form-modal/types";
import type { Flags, PermissionOptions, RolePermission } from "@/lib/role-permissions";

const ACTIONS: { flag: keyof Flags; label: string; action: "view" | "add" | "edit" | "delete" | "export" }[] = [
  { flag: "IsPageAllow", label: "View", action: "view" },
  { flag: "Add", label: "Add", action: "add" },
  { flag: "Edit", label: "Edit", action: "edit" },
  { flag: "Delete", label: "Delete", action: "delete" },
  { flag: "Export", label: "Export", action: "export" },
];

const VIEW_TYPES = [
  { label: "SELF – all records, including mine", value: "SELF" },
  { label: "ALL – all records, except mine", value: "ALL" },
];

/** The page (menu / sub-menu) chosen in the form, if complete. */
export function chosenPage(options: PermissionOptions, values: FormValues) {
  const menu = options.menus.find((m) => String(m.MenuId) === values.MenuId);
  if (!menu) return null;
  if (menu.MenuType === "PAGE") return { menu, subMenuId: null, pageKey: menu.MenuKey };
  const sub = menu.SubMenus.find((s) => String(s.SubMenuId) === values.SubMenuId);
  return sub ? { menu, subMenuId: sub.SubMenuId, pageKey: sub.SubMenuKey } : null;
}

/**
 * Fields of the Add / Edit role-permission modal (spec §6.2). Depends on the current values: the
 * Sub-menu field only for GROUP menus; roles that already have a permission for the chosen page aren't
 * offered; actions the signed-in user doesn't have are disabled (grant limit); Add / Edit / Delete /
 * Export need View. Editing: Role and Menu / Sub-menu are read-only, and an action the permission
 * already has stays switchable even if the editor lacks it (switching it off is allowed).
 */
export function rolePermissionFields(options: PermissionOptions, existing: RolePermission[], editing?: RolePermission) {
  return (values: FormValues): FormField[] => {
    const menu = editing
      ? { MenuId: editing.MenuId, Label: editing.MenuLabel, MenuType: editing.MenuType, SubMenus: [] as PermissionOptions["menus"][number]["SubMenus"] }
      : options.menus.find((m) => String(m.MenuId) === values.MenuId);
    const page = editing ? { pageKey: editing.PageKey } : chosenPage(options, values);
    const grant = page ? options.grantable[page.pageKey] : undefined;
    const viewOn = values.IsPageAllow === "1";

    const fields: FormField[] = [
      { name: "Title", label: "Title", type: "text", required: true, maxLength: 50, width: "half" },
      editing
        ? { name: "MenuId", label: "Menu", type: "select", disabled: true, startRow: true, options: [{ label: editing.MenuLabel, value: String(editing.MenuId) }] }
        : {
            name: "MenuId",
            label: "Menu",
            type: "select",
            required: true,
            startRow: true,
            options: [{ label: "Select Menu", value: "" }, ...options.menus.map((m) => ({ label: m.Label, value: String(m.MenuId) }))],
          },
    ];

    if (menu?.MenuType === "GROUP") {
      fields.push(
        editing
          ? { name: "SubMenuId", label: "Sub-menu", type: "select", disabled: true, options: [{ label: editing.SubMenuLabel ?? "", value: String(editing.SubMenuId) }] }
          : {
              name: "SubMenuId",
              label: "Sub-menu",
              type: "select",
              required: true,
              options: [{ label: "Select Sub-menu", value: "" }, ...menu.SubMenus.map((s) => ({ label: s.Label, value: String(s.SubMenuId) }))],
            },
      );
    }

    if (editing) {
      fields.push({ name: "RoleId", label: "Role", type: "select", disabled: true, options: [{ label: editing.RoleName, value: String(editing.RoleId) }] });
    } else {
      // Roles below you without a permission for the chosen page.
      const chosen = chosenPage(options, values);
      const taken = new Set(
        chosen
          ? existing.filter((p) => p.MenuId === chosen.menu.MenuId && (p.SubMenuId ?? null) === chosen.subMenuId).map((p) => p.RoleId)
          : [],
      );
      fields.push({
        name: "RoleId",
        label: "Role",
        type: "select",
        required: true,
        options: [{ label: "Select Role", value: "" }, ...options.roles.filter((r) => !taken.has(r.RoleId)).map((r) => ({ label: r.RoleName, value: String(r.RoleId) }))],
      });
    }

    fields.push({ type: "heading", name: "actionsHeading", label: "Actions" });
    ACTIONS.forEach(({ flag, label, action }, i) => {
      const canGrant = Boolean(grant?.[action]) || Boolean(editing?.[flag]);
      fields.push({
        name: flag,
        label,
        type: "checkbox",
        compact: true,
        span: 2,
        startRow: i === 0,
        disabled: !canGrant || (flag !== "IsPageAllow" && !viewOn),
      });
    });
    fields.push({ name: "ViewType", label: "View Type", type: "select", startRow: true, width: "half", options: VIEW_TYPES });
    return fields;
  };
}

/** Form values → API flags; with View off every action is off (the API does the same). */
export function flagsFromValues(values: FormValues): Flags {
  const view = values.IsPageAllow === "1";
  const on = (name: string) => view && values[name] === "1";
  return { IsPageAllow: view, Add: on("Add"), Edit: on("Edit"), Delete: on("Delete"), Export: on("Export") };
}

export const flagValues = (p: Flags): FormValues => ({
  IsPageAllow: p.IsPageAllow ? "1" : "0",
  Add: p.Add ? "1" : "0",
  Edit: p.Edit ? "1" : "0",
  Delete: p.Delete ? "1" : "0",
  Export: p.Export ? "1" : "0",
});
