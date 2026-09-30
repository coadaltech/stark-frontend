# Auth, organization sites & staff — build results

Feature spec: `../001_Auth_Org_Sites_Staff.md` · Layers: `../auth-org-staff-layers/README.md`.
One section per completed layer (newest last).

---

## Layer 01 — Database foundations ✅ (2026-09-30)

**What exists now**
- Repo SQL files (applied in order by `bun run db:sql`, all idempotent):
  | File | Creates / changes |
  |---|---|
  | `stark-backend/sql/003_login_organization_nullable.sql` | `login."OrganizationId"` nullable (NULL = platform account, i.e. DEVELOPER) |
  | `stark-backend/sql/004_roles.sql` | `sys_role."RolePriority"` (integer, unique, 1 = highest) and `sys_role."IsStaffCreatable"` (smallint, default 0); the 14 roles at fixed RoleIds; priority/creatable values; unique `role (OrganizationId, RoleId)`; procedure `assign_default_roles(org)`; roles for every existing organization |
  | `stark-backend/sql/005_login_username_unique.sql` | unique `lower(login."UserName")` for non-deleted rows |
  | `stark-backend/sql/006_auth_session.sql` | `auth_session` table + `LoginId` index |
- Role data (`sys_role`):

  | Priority | RoleId | Role | Creatable as staff |
  |---|---|---|---|
  | 1 | 1 | DEVELOPER | no (seed only) |
  | 2 | 2 | SUPERADMIN | yes |
  | 3 | 7 | ADMIN | yes |
  | 4 | 3 | DISTRIBUTOR | no |
  | 5 | 4 | RETAILOR | no |
  | 6 | 5 | FANTER | no |
  | 7 | 6 | CASH AGENT | no |
  | 8 | 8 | MANAGER | yes |
  | 9 | 9 | MARKETER | yes |
  | 10 | 10 | AUDITOR | yes |
  | 11 | 11 | ADMIN DATA ENTRY OPERATOR | yes |
  | 12 | 12 | DATA ENTRY OPERATOR | yes |
  | 13 | 13 | ADMIN TALLY OPERATOR | yes |
  | 14 | 14 | TALLY OPERATOR | yes |

- Organization 1001 has its 14 `role` rows; web login (`IsWebLogin = 1`) for RoleIds 1, 2, 7, 11.

**Decisions made in this layer**
- Priority and creatability live on `sys_role` (global), not on per-organization `role` rows.
- Seeding sets priority/creatable only the first time (while `RolePriority` is NULL), so later manual
  changes in the DB are not undone by re-running `db:sql`.

**Verified**
- Live DB: first `db:sql` run added only the two columns + priority index and their values; a second
  run changed nothing; existing objects (indexes, `assign_default_roles`) unchanged.
- Fresh DB (scratch database, since dropped): identical columns, indexes, procedure and role data
  (36 items compared); no per-organization role rows because it has no organizations.

**Not yet**: no accounts exist (`login` is empty) — layer 02 seeds the developer.
