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

## Layer 05 — Main-app sign-in (frontend) ✅ (2026-09-30)

**What exists now** (`stark-frontend`)
- `src/lib/auth/tokens.ts` — cookie names `stark_access` / `stark_refresh`, `fetchSessionUser`
  (`GET /auth/me`; `site="main"` only), `needsRefresh` (reads `exp` only, to time refreshes),
  `refreshTokens` (calls `POST /auth/refresh`), `ApiUnavailableError`,
  `authCookies` (httpOnly, SameSite=Lax, host-only, `Secure` in production, max-age = token lifetime).
- `src/lib/auth/session.ts` — `getSession()` (API-confirmed, one call per request), `requireSession()` (→ `/login`),
  `getAccessToken()`.
- `src/lib/auth/actions.ts` — server actions `login` (API message shown as-is, username kept after a
  failed try, safe `next` redirect) and `logout` (ends the session on the API, clears cookies → `/login`).
- `src/proxy.ts` — valid → continue; missing/expired access token → silent refresh (new cookies on the
  response and on the current request); no session → `/login?next=<path+query>` and stale cookies
  cleared; signed-in visitor on `/login` → `/`. Excludes `/api/`, Next internals and static files.
- `src/app/api/[...path]/route.ts` — forwards browser calls (GET/POST/PATCH/PUT/DELETE) to `API_URL`
  with `Authorization: Bearer`, refreshing first if needed; 401 "Please sign in again." when the
  session is gone; `/api/auth/*` → 404; API down → 502.
- `src/lib/api.ts` — base `/api` in the browser, `API_URL` on the server; optional `token`; a browser
  401 → `/login?next=<current page>`. `NEXT_PUBLIC_API_URL` is no longer used.
- `(app)/layout.tsx`, `(app)/page.tsx`, `(app)/organizations/page.tsx` call `requireSession()`;
  `listOrganizations(token)` forwards the token from the server.
- `/login` page + `components/auth/login-form.tsx` (card in the app frame);
  `components/layout/user-menu.tsx` (avatar menu with Logout); `app-header.tsx` shows the real
  role and username.
- `.env.example`: `API_URL` only.
- `src/app/error.tsx` — "Could not load this page…" + Try again, when the API can't be reached.

**Verified** (browser tests with Chrome against the user's dev server + a temporarily started API;
test sessions deleted afterwards)
- Signed out: `/` → `/login`; `/organizations?x=1` → `/login?next=%2Forganizations%3Fx%3D1`.
- Wrong password → "Invalid username or password.", username kept. Right password → back to
  `/organizations?x=1`; header shows `DEVELOPER` + `developer`; organizations list loads.
- Cookies: both httpOnly, Lax, host-only; access 15 min, refresh 7 days; `document.cookie` is empty.
- `/api/organizations` → 200; `/api/auth/me` → 404; PATCH with an invalid value through `/api` → 422
  with field errors (bodies forwarded, nothing changed); GET detail → 200.
- Signed in on `/login` → `/`.
- Access cookie deleted → page loads via silent refresh (new access cookie, refresh token rotated);
  tampered access cookie → treated as invalid, refreshed, 200; `/api` refresh path → 200.
- Avatar menu shows `DEVELOPER` / `developer · DEVELOPER` / Logout; Logout → `/login`, both cookies
  gone, the old refresh token is rejected by the API (401).
- Cookies cleared while `/organizations` is open, then Action clicked → browser goes to
  `/login?next=%2Forganizations`.
- `next=//evil.example` → lands on `/` (no open redirect).
- `tsc` clean; lint: 0 errors (4 warnings, all pre-existing in organization files).

**Not directly tested in the browser**: Add/Edit organization saves through the UI (the same `/api`
forwarding was exercised with GET and PATCH); a non-developer trying the main app (rejected by the API
with the generic message — covered in layers 03/04; there are no staff accounts yet).

**Not yet**: organization sites (host → organization) and their sign-in come in the next layers.

### Layer 05 amendment — no JWT secret in the frontend (2026-09-30)

**Why:** with HS256 the frontend would hold the same secret the API signs with, so a leak of the
frontend's env could mint valid tokens. Chosen option: the frontend asks the API instead.

**Changed**
- Removed `src/lib/auth/jwt.ts` and `JWT_ACCESS_SECRET` from `.env.local` / `.env.example`.
- Pages: `getSession()` → `GET /auth/me` (valid token, active session, active account), one call per
  request shared by layout and page; only `site = "main"` accepted.
- `proxy.ts`: refresh timing from the token's `exp` (not trusted); on `/login` it asks the API, so a
  revoked/forged token can't loop between `/` and `/login`.
- `/api` route: refreshes near expiry, and once more + one retry if the API answers 401.
- API unreachable (network error or 5xx) is not "signed out": pages show `src/app/error.tsx`, `/api`
  returns 502, cookies are kept.

**Verified** (Chrome, dev server + temporarily started API; test sessions deleted)
- The full layer-05 browser suite again: same results as above.
- Session revoked through the API while its access token was still unexpired → next page load goes to
  `/login`, both cookies cleared.
- Forged access token (future `exp`) + valid refresh cookie → refreshed, page loads (lands on `/`, not
  the requested page — accepted); `/api` with a forged token → refresh + retry → 200.
- Forged access token, no refresh cookie → `/login`, cookies cleared, no redirect loop.
- API stopped → error page, cookies kept, `/api/organizations` → 502.
- `tsc` clean; lint 0 errors (same 4 pre-existing warnings).

## Layer 06 — Site resolution (backend) ✅ (2026-09-30)

**What exists now** (`stark-backend`)
- `src/sites/host.ts` — `isValidHost` (`host[:port]`, lower case, port 1–65535) and `normalizeHost`
  (trim + lower-case).
- `src/env.ts` — `MAIN_APP_HOST` (default `localhost:3000`, normalized; invalid value → startup
  refused). Outdated comment about the frontend needing the JWT secret corrected.
- `src/modules/sites.ts` — `GET /sites/resolve?host=…` (public): main host → `{ kind: "main" }`;
  organization with `lower(OrganizationDomainURL) = host`, Domain ON, not deleted →
  `{ kind: "organization", organizationId, name }`; anything else (incl. malformed hosts) → 404
  "Site not found"; missing `host` → 422. Registered in `src/index.ts`.
- `src/modules/organizations.ts` — Domain save validation re-enabled: `host[:port]` format and
  "This domain is reserved for the main app" (plus the existing required-when-ON and unique checks).
- `.env.example` — `MAIN_APP_HOST=localhost:3000` (the real `.env` wasn't touched; the default applies).

**`stark-frontend`**: Domain tab validation re-enabled with the same rule; placeholder
"example.com or acme.localhost:3000".

**Verified** (running API, temporary organization removed afterwards, sequences restored)
- Saving the domain: `http://…`, a path, spaces, port 0 / 70000, trailing dot → 422 format message;
  `LOCALHOST:3000` → "reserved for the main app"; `localhost:5000` → "Domain already used by
  TEST-ORG"; empty while ON → required. `lgaikhai-l06.com` and ` Acme-L06.LocalHost:3000 ` → saved as
  `acme-l06.localhost:3000`.
- Resolve: `localhost:3000` / `LocalHost:3000` → main; `localhost:5000` → TEST-ORG (1001);
  test organization → organization while Domain ON (any case), 404 while Domain OFF or deleted;
  other port, no port, unknown host, malformed host → 404; no `host` → 422; no token needed.
- `MAIN_APP_HOST=App.LocalHost:3000` → that host is main, `localhost:3000` → 404;
  `MAIN_APP_HOST=http://localhost:3000` → API refuses to start.
- Backend and frontend `tsc` clean; frontend lint 0 errors.

**Not browser-tested**: the Domain tab's client-side message (same rule as the API, which was tested).

**Note:** TEST-ORG's domain `localhost:5000` resolves, but the app only runs on port 3000, so that
site can't be opened; use e.g. `test.localhost:3000` (spec §2).

**Not yet**: the frontend doesn't use resolution yet — layer 07 routes hosts to sites.
