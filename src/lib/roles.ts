// Role ids (sys_role; spec §3).
export const ROLE = { DEVELOPER: 1, SUPERADMIN: 2, ADMIN: 7 } as const;

/** Roles that may add staff, so see the Staff menu (spec §3). */
export const canManageStaff = (roleId: number) =>
  roleId === ROLE.DEVELOPER || roleId === ROLE.SUPERADMIN || roleId === ROLE.ADMIN;
