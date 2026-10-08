import { api } from "@/lib/api";

// Permissions section API (specs/build/permissions/permission_spec.md §5).

export type Flags = { IsPageAllow: boolean; Add: boolean; Edit: boolean; Delete: boolean; Export: boolean };
export type ViewType = "ALL" | "SELF";

/** A role permission of a role below the signed-in user. */
export type RolePermission = Flags & {
  RolePermissionId: number;
  Title: string;
  RoleId: number;
  RoleName: string;
  MenuId: number;
  MenuLabel: string;
  MenuType: "PAGE" | "GROUP";
  SubMenuId: number | null;
  SubMenuLabel: string | null;
  PageKey: string;
  ViewType: ViewType;
  UpdatedBy: string;
  UpdatedDate: string;
};

export type PermissionOptions = {
  menus: {
    MenuId: number;
    MenuKey: string;
    Label: string;
    MenuType: "PAGE" | "GROUP";
    SubMenus: { SubMenuId: number; SubMenuKey: string; Label: string }[];
  }[];
  /** Roles below the signed-in user, highest first. */
  roles: { RoleId: number; RoleName: string }[];
  /** The signed-in user's own actions per page key (they can only grant these). */
  grantable: Record<string, Record<"view" | "add" | "edit" | "delete" | "export", boolean>>;
};

export type CreateRolePermissionInput = Flags & {
  Title: string;
  RoleId: number;
  MenuId: number;
  SubMenuId: number | null;
  ViewType: ViewType;
};
export type UpdateRolePermissionInput = Partial<Flags & { Title: string; ViewType: ViewType }>;

/** Server only. */
export function getPermissionOptions(token: string | undefined) {
  return api<PermissionOptions>("/site/permissions/options", { cache: "no-store", token });
}

/** Server only. */
export function listRolePermissions(token: string | undefined) {
  return api<RolePermission[]>("/site/permissions/roles", { cache: "no-store", token });
}

/** Browser. */
export function createRolePermission(input: CreateRolePermissionInput) {
  return api<RolePermission>("/site/permissions/roles", { method: "POST", body: JSON.stringify(input) });
}

/** Browser. */
export function updateRolePermission(id: number, input: UpdateRolePermissionInput) {
  return api<RolePermission>(`/site/permissions/roles/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

/** Browser. */
export function deleteRolePermission(id: number) {
  return api<void>(`/site/permissions/roles/${id}`, { method: "DELETE" });
}

// ---- Staff permissions (Staff tab): named sets assigned to staff ---------------------------

/** One page of a staff permission. */
export type StaffPermissionPage = Flags & {
  MenuId: number;
  SubMenuId: number | null;
  MenuLabel: string;
  SubMenuLabel: string | null;
  PageKey: string;
};

export type StaffPermission = {
  StaffPermissionId: number;
  Title: string;
  Pages: StaffPermissionPage[];
  /** How many staff have it. */
  AssignedCount: number;
  /** False when it is assigned to staff at or above the signed-in user's role. */
  CanEdit: boolean;
  UpdatedBy: string;
  UpdatedDate: string;
};

export type StaffPermissionInput = { Title: string; Pages: ({ MenuId: number; SubMenuId: number | null } & Flags)[] };

/** Server only. */
export function listStaffPermissions(token: string | undefined) {
  return api<StaffPermission[]>("/site/permissions/staff-permissions", { cache: "no-store", token });
}

/** Browser. */
export function createStaffPermission(input: StaffPermissionInput) {
  return api<StaffPermission>("/site/permissions/staff-permissions", { method: "POST", body: JSON.stringify(input) });
}

/** Browser: Title and / or Pages (pages replaced as a whole). */
export function updateStaffPermission(id: number, input: Partial<StaffPermissionInput>) {
  return api<StaffPermission>(`/site/permissions/staff-permissions/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

/** Browser. */
export function deleteStaffPermission(id: number) {
  return api<void>(`/site/permissions/staff-permissions/${id}`, { method: "DELETE" });
}
