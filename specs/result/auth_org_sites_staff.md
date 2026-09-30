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
  | `stark-backend/sql/005_login_username_unique.sql` | usernames unique **per organization** (see amendment below) |
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

### Amendment (2026-09-30): per-organization usernames

**Changed**
- `005_login_username_unique.sql` now drops the platform-wide `login_username_key` and creates
  `login_org_username_key` on `("OrganizationId", lower("UserName")) NULLS NOT DISTINCT` (non-deleted):
  the same username may exist in different organizations; developers (NULL) are unique among
  themselves.
- Trigger `login_reserve_developer_username` (insert/update of UserName, OrganizationId,
  RecordStatus): developer usernames are reserved platform-wide — staff can't use one, a developer
  can't take a staff username. Serialised per username with an advisory lock; raises a
  unique-violation (constraint `login_developer_username_reserved`).
- Legacy procedures matching `login."UserName"` to `transaction."AddedBy"`/`UpdatedBy` now also match
  the organization (15 joins): `transaction_count_of_organization` (2), `rpt_Trans_Productivity` (2),
  `rpt_Trans_Productivity_Topper_Looser_insert` (4), `rpt_transactions_after_timing` (2),
  `transaction_audit_all_of_organization`, `declare_transaction_audit_all_of_organization`,
  `rpt_trans_audit_productivity`, `rpt_trans_productivity_shiftwise`,
  `rpt_trans_productivity_datewise_dynamic`. Five others already reached `login` through the
  organization's ledgers (unchanged). Side effect: transactions entered by a developer (no
  organization) don't match a login in these reports.
- Clarified: `role_organization_role_key` means one role **definition** per organization and role
  type; any number of staff may hold the same role.

**Verified**
- 11 rule checks in a rolled-back transaction (same username in another organization allowed;
  case-variant in the same organization, second developer, developer↔staff reuse, rename into a
  reserved name all rejected; deleted rows free the username).
- Race: developer and staff claiming the same username concurrently → the developer insert waited and
  was rejected; only one row existed.
- `plpgsql_check`: the 9 edited procedures (+ an unchanged control) — no findings; smoke runs OK,
  including the two dynamic-SQL reports.
- Live vs fresh database again identical (40 items incl. the new index and trigger).

**Not yet**: no accounts exist (`login` is empty) — layer 02 seeds the developer.

---

## Layer 02 — Developer seed ✅ (2026-09-30)

**What exists now**
- `stark-backend/scripts/seed-developer.ts`, run with `bun run db:seed:developer`.
  - Reads `DEVELOPER_USERNAME` / `DEVELOPER_PASSWORD` from `stark-backend/.env` (set by the owner;
    `.env.example` has placeholders `developer` / `change-me`).
  - Creates a `login` row: `OrganizationId NULL`, `LoginType 1` (DEVELOPER), `LoginName "DEVELOPER"`,
    `Mobile "0000000000"`, `LedgerId 0`, `AccountStatus '1'`, `RecordStatus 'A'`, audit `SYSTEM`,
    bcrypt password (cost 10) — in a transaction.
  - Idempotent: an existing developer with that username (any case) is left unchanged.
  - Refuses with a clear message: missing values; username with spaces or > 30 chars; password
    outside 8–72 chars or equal to the placeholder; username already used by staff (the layer-01
    reserved-username trigger → "already used by staff; choose another DEVELOPER_USERNAME").
- **Live DB:** developer account created — LoginId 1, username from `.env` ("developer"),
  organization NULL, role 1, active. `login` has exactly this one row.
- `.env`: obsolete `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` removed (from the earlier removed
  auth work). `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` from that work are still in `.env` and will
  be reviewed in layer 03.

**Decisions made in this layer**
- Fixed `LoginName "DEVELOPER"` and `Mobile "0000000000"` for seeded developers.
- Credentials are set by the owner in `.env`.

**Verified** (scratch database, since dropped)
- Refusals: missing username, username with a space, short password, placeholder password, username
  already used by staff.
- First run created one developer; second run and a case-variant username changed nothing; the
  stored password verifies and a different password on a later run is ignored.
- Live: first run created LoginId 1; second run changed nothing.

**Not yet**: nobody can sign in — layer 03 adds the auth API.
