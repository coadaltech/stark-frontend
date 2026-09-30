# 01 — Database foundations

**Goal:** everything the database needs for auth and roles exists in repo SQL files, so a fresh
database gets it via `bun run db:sql`.

**Scope**
- SQL files (idempotent) for objects that exist in the running DB but were removed from the repo:
  14 roles in `sys_role` at fixed RoleIds; `assign_default_roles(org)` (copies missing roles into
  `role` with `IsWebLogin` for 1, 2, 7, 11); unique `role (OrganizationId, RoleId)`; unique
  `lower(login.UserName)` (non-deleted); `auth_session` table.
- `login.OrganizationId` nullable (already changed in the DB by hand) captured in a SQL file.
- Role **priority** (spec §3) stored explicitly — **decided:** `sys_role."RolePriority"` (1 = highest,
  unique) and `sys_role."IsStaffCreatable"` (1/0); not copied into per-organization `role` rows.
- Run `assign_default_roles` for every existing organization.

**Depends on:** —
**Done when:** `db:sql` runs twice without changes on the current DB, and on an empty DB produces the
same objects.
