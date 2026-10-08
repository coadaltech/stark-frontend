// Role ids (sys_role; spec §3).
export const ROLE = { DEVELOPER: 1, SUPERADMIN: 2, ADMIN: 7 } as const;

/**
 * Roles that manage permissions (the Permissions section is fixed to them and not itself controlled
 * by permissions — permission_spec.md §3.3).
 */
export const canManagePermissions = (roleId: number) =>
  roleId === ROLE.DEVELOPER || roleId === ROLE.SUPERADMIN || roleId === ROLE.ADMIN;
