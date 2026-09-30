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

---

## Layer 03 — Backend auth core ✅ (2026-09-30)

**What exists now** (`stark-backend`)
- `src/auth/jwt.ts` — hand-written HS256 JWT sign/verify on Web Crypto (header pinned to
  `HS256`/`JWT`, constant-time signature check, issuer `stark`, expiry with 5 s skew); SHA-256 helper.
- `src/auth/tokens.ts` — access token **15 min**, refresh token **7 days** (sliding), separate
  secrets; claims `typ, sub (LoginId), sid (session), site, org, usr, name, role, roleName, iat, exp,
  iss`; `site = "main"` for the main app (`MAIN_SITE`), `org = null` for developers.
- `src/auth/guard.ts` — `authGuard` Elysia plugin: `Authorization: Bearer` + session active, not
  expired and on the same site → typed `user`; otherwise 401 "Please sign in again." (applied to the
  organizations API in layer 04).
- `src/modules/auth.ts`, registered in `src/index.ts`:
  | Endpoint | Behaviour |
  |---|---|
  | `POST /auth/login` | main app: looks up **developers only** (organization NULL, role 1, not deleted), username any case; wrong password / unknown user / non-developer → generic 401; inactive developer → 403; creates an `auth_session` (site "main") |
  | `POST /auth/refresh` | rotates the refresh token; previous token accepted for 30 s; older token → session revoked (`reuse`); re-checks the account (`account` / `inactive` → revoked); sliding 7-day expiry; keeps the site |
  | `POST /auth/logout` | revokes the session (`logout`); always 204 |
  | `GET /auth/me` | guarded; fresh user from the DB |
- `src/db/legacy.ts` — Drizzle definitions for `login`, `sys_role`, `role`, `auth_session`.
- `src/env.ts` — `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` required, ≥ 32 chars (existing values
  kept: 64 chars each, different).
- `sql/006_auth_session.sql` — added `auth_session."Site"` (varchar 255, NOT NULL, default `main`).

**Decisions made in this layer**
- Existing JWT secrets kept.
- Tokens/sessions carry the site from the start (`main`), so layer 08 doesn't change the format.
- Non-developer with the correct password → generic credentials error (nothing revealed).
- No automated tests in the repo; verification scripted outside it.

**Verified** (against the running API; temporary accounts removed afterwards)
- Health public; empty login body → 422.
- Wrong password, unknown user and a SUPERADMIN (correct password) → identical 401 message; timing
  identical (51 ms / 51 ms).
- Inactive developer → 403 "Your account is inactive…".
- Developer login (upper-case username) → 200; access 900 s, refresh 7 days; site "main", org null;
  session row has Site "main".
- `/auth/me`: with token → user; no token / tampered / `alg: none` / expired / refresh token as
  access → 401.
- Refresh rotates; previous token within grace → 200; a token two rotations old → 401 and the session
  is revoked (newest refresh and access tokens → 401).
- Logout → 204; afterwards `/auth/me` and refresh → 401 immediately; garbage token → 204.
- Developer deactivated mid-session → refresh 403 and session revoked (`inactive`).
- Startup without the secrets → refused ("Missing required env var: JWT_ACCESS_SECRET"); a short
  secret → refused ("must be at least 32 characters"). `.env.example` now lists both secrets (empty,
  with how to generate them).

**Known behaviour**: an access token stays valid for up to 15 min after an account is deactivated
(until its next refresh), unless the session is revoked; logout and token reuse end it immediately.

**Not yet**: the organizations API is still open — layer 04 protects it (developer only).

---

## Layer 04 — Protect the organizations API ✅ (2026-09-30)

**What exists now** (`stark-backend`)
- `src/auth/guard.ts` (revised):
  - `authenticate(authorization)` — Bearer access token valid **and** its session active, not expired,
    on the same site → `AuthUser`, else null.
  - `authGuard` — any signed-in user (401 "Please sign in again.").
  - `developerGuard` — signed in **and** DEVELOPER (role 1), organization NULL, site `main`;
    401 when not signed in, 403 "You don't have access to this." for anyone else.
  - Both run in Elysia's `derive` hook, i.e. **before body/param validation**, so signed-out callers
    get 401 (not validation details). Each guard does its whole check itself — Elysia "scoped" hooks
    only reach the module using the guard, so guards must not be stacked.
- `src/modules/organizations.ts`: `.use(developerGuard)` on all routes (list, get, create, update — all
  Edit tabs). `AddedBy` / `UpdatedBy` = signed-in username. `POST /organizations` inserts the
  organization and calls `assign_default_roles(<id>)` in **one transaction**.

**Found and fixed during this layer**
- A first version stacked `developerGuard` on `authGuard`; the inner hook didn't reach the
  organizations routes, so even the developer got 401. Replaced with the shared `authenticate()`
  function used by both guards.
- With `resolve`, an unauthenticated POST with an invalid body got 422 (validation runs before
  `resolve`). Switched both guards to `derive` → 401 first. Layer 03's `authGuard` (used by
  `/auth/me`) changed accordingly; the layer-03 checks were re-run and still pass.

**Verified** (against the running API; test data removed afterwards)
- No token → 401 for list, get, create (even with an invalid body) and update; malformed token → 401.
- Developer (main app) → list 200, get 200, create 201, update 200; invalid body → 422.
- Properly signed tokens with live sessions but the wrong identity → 403: SUPERADMIN on the main app,
  developer token from an organization site, developer role with an organization. A forbidden update
  changed nothing.
- Logout → the organizations API rejects that access token immediately (401).
- New organization: `AddedBy` = `UpdatedBy` = `developer`; **14 roles**, web login for 1, 2, 7, 11.
  Update: `UpdatedBy` = `developer`, `AddedBy` unchanged.
- Layer-03 suite re-run with the revised guard: all checks unchanged.

**Not directly tested**: a failure inside `assign_default_roles` rolling back the new organization
(guaranteed by the single transaction; not simulated on the live DB).

**Not yet**: the frontend has no sign-in, so the organizations screens can't load data now (the API
returns 401) — layer 05 adds main-app sign-in.
