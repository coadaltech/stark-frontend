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

## Layer 07 — Multi-site routing (frontend) ✅ (2026-09-30)

**What exists now** (`stark-frontend`)
- `src/lib/sites.ts` — `resolveSite(host)` (calls `GET /sites/resolve`; 404 → null; network/5xx →
  `ApiUnavailableError`) and `getSite()` (current request's Host, one call per render).
- `src/proxy.ts` — runs for every page **and `/api`**; asks the API for the site on every request
  (no cache), then:
  - organization host → rewrite to `/site/<orgId><path>` (every path);
  - unknown host → rewrite to `/site/unknown` (404 "Site not found");
  - main host → main app as before (refresh / sign-in redirects); `/site/*` → plain 404;
  - `/api/*` → main host only; other hosts → 404 JSON; API down → 502;
  - API down for a page → `/site/unavailable` → error page (500).
- `src/app/site/[orgId]/[[...path]]/page.tsx` — placeholder: organization name + "Sign-in for this
  site is coming soon." It re-resolves the Host itself and 404s unless it matches `orgId`.
- `src/app/site/unknown/` — "Site not found" card (404, title "Site not found · XYZ");
  `src/app/site/unavailable/page.tsx` — throws → `src/app/error.tsx`.
- `src/components/layout/site-frame.tsx` — `SiteFrame` (teal frame, no nav, optional title) and
  `MessageCard`; the login page now uses `SiteFrame`.
- `next.config.ts` — `allowedDevOrigins: ["*.localhost"]` (the dev server restarts itself on change).

**Verified** (your dev server + a temporarily started API; temporary organization `l07.localhost:3000`
removed afterwards, sequences restored)
- `l07.localhost:3000` (any case, any path incl. `/login`, `/organizations`, `/site/1001`) → 200
  placeholder "L07 TEST"; `/api/organizations` there → 404.
- `test.localhost:3000` (TEST-ORG's current domain) → TEST-ORG placeholder.
- Domain OFF → "Site not found" (404); back ON → placeholder immediately (no cache).
- `nobody.localhost:3000` (any path) → 404 "Site not found"; `/api` there → 404.
- Main host: `/` → `/login`; `/login` → sign-in page; `/site/1002`, `/site/unknown` → plain 404;
  `/api/organizations` signed out → 401. Full layer-05 browser suite re-run: unchanged.
- Chrome on `l07.localhost:3000`: no failed dev-asset requests or console errors.
- API stopped: organization, unknown and main hosts → error page with "Try again"; `/api` → 502.
- `tsc` clean (after `next typegen`); lint 0 errors.

**Note:** the tab title for "Site not found" is streamed by Next after the first HTML, so `curl`
shows "XYZ" while browsers show "Site not found · XYZ".

**Not yet**: organization-site sign-in and site-bound tokens (layer 08).

## Layer 08 — Site-bound sign-in ✅ (2026-09-30)

**What exists now**

`stark-backend`
- `sql/006_auth_session.sql` (applied to the live DB, only this file): new columns
  `SiteOrganizationId bigint` (NULL = main app) and `Rotation integer NOT NULL DEFAULT 0`.
- `src/sites/resolve.ts` — `resolveHost(host)` shared by `/sites/resolve` and auth.
- `src/auth/tokens.ts` — `AuthUser.siteOrganizationId` (claim `sorg`); refresh tokens carry `rot`
  (rotation number) instead of a random `jti` and can be rebuilt identically; `signJwt` takes an
  optional issue time.
- `src/auth/guard.ts` — the session must also match the token's site organization.
- `src/modules/auth.ts`
  - `POST /auth/login` takes `Host` → main app (developers only) or organization site (developers +
    that organization's accounts); unknown host → 404 "Site not found".
  - Per-account rules after a correct password: inactive account / organization inactive / role
    without web login → 403 with the agreed messages (developers skip the organization/role checks).
  - `POST /auth/refresh` takes `Host`: token from another site → 401 without touching the session;
    session's own site gone (Domain OFF, deleted, domain moved) → revoked `site`; rules re-checked
    (revoked `organization` / `role` / `inactive` with the 403 message); parallel refreshes in the
    grace window get the same current refresh token back.
  - `GET /auth/me` re-checks site + rules; response includes `siteOrganizationId`.

`stark-frontend`
- `src/lib/sites.ts` — `getHost()`, `sessionIsForSite(user, site, host)`.
- `src/lib/auth/session.ts` — `getSession()` accepts only a session for the current site.
- `src/lib/auth/actions.ts` — login sends `Host`; `refreshTokens(token, host)` sends `Host`.
- `src/proxy.ts` — the same refresh / sign-in redirect logic on every site (`sitePages`), then
  `next()` on the main host or a rewrite to `/site/<orgId>/…`; leaves cookies alone on the sign-in
  form POST; refreshed pairs for another site are discarded.
- `src/lib/org-site.ts` — `requireOrganizationSite(orgId)` (host must still resolve to that org).
- `src/app/site/[orgId]/login/page.tsx` — sign-in card with the organization's name;
  `src/app/site/[orgId]/[[...path]]/page.tsx` — signed-in placeholder (header, user menu with
  Logout, "Signed in as … (ROLE)").
- `src/app/api/[...path]/route.ts` — refreshes at the request's Host.

**Verified** (running API + your dev server; temporary organizations `l08a.localhost:3000` /
`l08b.localhost:3000`, their staff and all test sessions removed; sequences restored)
- API sign-in: developer on main and on both organization sites (any host case); staff only on
  their own site; MANAGER → role message; inactive → inactive message; other organization's staff,
  wrong password → generic 401; same username in both organizations → the right account per site;
  unknown host → 404; missing Host → 422.
- Organizations API: developer token from an organization site → 403; main developer → 200.
- Organization deactivated → staff login/refresh 403 (session revoked `organization`), `/auth/me` 401;
  developer still signs in and refreshes.
- Domain OFF → sessions end (`/auth/me` 401, refresh 401 revoked `site`), login 404. Domain moved to
  organization B → A's old sessions end.
- Refresh: 5 parallel refreshes → all 200, one refresh token, rotation 1, not revoked; replaying the
  original after a further rotation → revoked `reuse`; previous token after the grace → `reuse`; token
  presented at B or main → 401 with the session untouched, still works at A.
- Browser (Chrome): `l08a…/reports?x=1` → org login (org name, title "Sign in · L08 ALPHA") → staff
  errors shown → sign-in lands back on `/reports?x=1` with header SUPERADMIN / a_super; cookies are
  host-only per site; main and B stay signed out; A's cookies copied to B → not accepted, cleared, no
  redirect loop; developer on B incl. silent refresh; logout on A leaves B signed in; main app sign-in
  unchanged; no console errors.
- Main-app suites (layer 05 + amendment) re-run: unchanged.
- Backend and frontend `tsc` clean; lint 0 errors.

**Found and fixed during this layer**
- Parallel refreshes could sign users out (see decisions in the layer file) — present since layer 03.
- A copied refresh token could rotate another site's session — refresh now takes Host.
- Your dev server kept a stale compiled `/api` route (old refresh call) until the file changed; if
  anything odd shows after pulling these changes, restart `next dev`.

**Not yet**: organization shell, Organization-Info and the Staff menu (layer 09).

## Layer 09 — Organization site shell & Organization-Info ✅ (2026-10-01)

**What exists now**

`stark-backend`
- `src/auth/access.ts` — site/account rules shared by sign-in and guards (moved out of
  `modules/auth.ts`, unchanged behaviour): `siteOfHost`, `siteStillValid`, `selectAccount`,
  `accountsOfSite`, `denial`, messages.
- `src/auth/guard.ts` — `organizationSiteGuard`: session + site still valid + account still allowed,
  on every call; gives handlers `user` and `organizationId` (the site's organization). Main-app
  token → 403.
- `src/modules/organization-site.ts` — `GET /site/organization-info` → `{ organizationId, name,
  totalStaff }` (non-deleted accounts of the organization). Registered in `src/index.ts`.

`stark-frontend`
- `src/components/layout/nav-bar.tsx` — `NavBar` (home tab + dropdown menus), extracted from
  `main-nav.tsx`; strips the internal `/site/<id>` prefix when deciding the active tab.
  `MainNav` now uses it (Dashboard + Organizations, unchanged).
- `src/components/layout/organization-nav.tsx` — Organization-Info tab + Staff ▾ (when allowed).
- `src/lib/roles.ts` — `canManageStaff(roleId)` (DEVELOPER, SUPERADMIN, ADMIN).
- `src/lib/organization-site.ts` — `getOrganizationInfo(token)`.
- `src/app/site/[orgId]/(app)/layout.tsx` — organization-site frame: header (user menu with Logout),
  nav, footer; requires the site and a session.
- `src/app/site/[orgId]/(app)/page.tsx` — Organization-Info panel (ID, Name, Total Staff).
- `src/app/site/[orgId]/(app)/staff/page.tsx` — placeholder; 404 for roles that can't manage staff.
- Removed `src/app/site/[orgId]/[[...path]]/page.tsx`.

**Verified** (temporary organization `l09.localhost:3000` with SUPERADMIN, ADMIN, ADMIN DATA ENTRY
OPERATOR, MANAGER, an inactive and a deleted account — all removed afterwards; sequences restored)
- API: developer and staff → `{1002, "L09 GAMMA", totalStaff: 5}` (deleted excluded, inactive
  counted); main-app token → 403; no/junk token → 401; still-valid staff token after the organization
  is deactivated → 401 (developer 200); account deactivated → 401; Domain OFF → 401.
- Browser: developer, SUPERADMIN, ADMIN see "Organization-Info  Staff ▾"; ADMIN DATA ENTRY OPERATOR
  sees only Organization-Info and gets 404 on `/staff`; Staff ▾ → Staff → placeholder with the Staff
  tab highlighted; Organization-Info tab active on `/`; titles "Organization-Info · L09 GAMMA",
  "Staff · L09 GAMMA"; unknown path → 404; no console errors.
- Main app: Dashboard + Organizations ▾ unchanged, Organizations list loads, `/staff` → 404.
- Backend and frontend `tsc` clean; lint 0 errors.

**Notes**
- Your Next dev server wasn't running during this layer; I started one for the tests and stopped it.
- 404 pages use Next's default (unstyled) page, on both the main app and organization sites.

**Not yet**: Staff API (layer 10), Staff list + Add Staff (layer 11).

## Layer 10 — Staff API ✅ (2026-10-01)

**What exists now** (`stark-backend`)
- `src/auth/guard.ts` — organization-site checks shared by `organizationSiteGuard` and the new
  `staffManagerGuard` (also requires DEVELOPER, SUPERADMIN or ADMIN → else 403, before validation).
- `src/modules/staff.ts` (registered in `src/index.ts`), all for the session's site organization:
  - `GET /staff` — non-deleted staff, newest first: LoginId, LoginName, LoginType, RoleName,
    UserName, StaffWorkMode, Mobile, Address, AccountStatus, UpdatedBy, UpdatedDate.
  - `GET /staff/roles` — roles the caller may give (creatable, strictly below the caller by
    priority, defined for the organization), highest first.
  - `POST /staff` — Staff Name (≤ 70, stored UPPERCASE + " STAFF A/C"), Role, W-Mode 0–3, Username
    (1–30 of letters/digits/`.`/`_`/`-`), Password (1–72, bcrypt), Mobile (10 digits), Address
    (optional, ≤ 50, UPPERCASE). Server sets OrganizationId, LedgerId 0, AccountStatus '1',
    RecordStatus 'A', AddedBy/UpdatedBy = caller's username, dates = local time. 201 → the list item.

**Verified** (running API; temporary organizations `l10a` / `l10b` with staff; everything removed
afterwards, sequences restored)
- Roles: developer → SUPERADMIN…TALLY OPERATOR (9); SUPERADMIN → ADMIN… (8); ADMIN → MANAGER… (7);
  ADMIN DATA ENTRY OPERATOR → 403; main-app developer → 403; no token → 401.
- Create: developer → SUPERADMIN, SUPERADMIN → ADMIN, ADMIN → MANAGER / TALLY OPERATOR (201).
  SUPERADMIN → SUPERADMIN, ADMIN → ADMIN, DEVELOPER, DISTRIBUTOR, CASH AGENT, unknown role → 422 on
  Role. Non-manager caller → 403 (also with an invalid body).
- Stored row: OrganizationId = site, LedgerId 0, "RAHUL KUMAR STAFF A/C", address uppercased and
  trimmed, active, AddedBy/UpdatedBy = caller, bcrypt hash that verifies; a new ADMIN signs in at the
  site.
- Usernames: same organization other case → 422; other organization → 201; developer's username (any
  case) → 422; deleted account's username → 201; 5 parallel identical creates → one 201, four 422.
- Validation 422 with field messages: mobile, username with space / `@` / 31 chars, blank or 71-char
  name (70 OK), W-Mode 5, 73-char password, 51-char address, all fields missing; no address → 201.
- Isolation: A's list has only A's non-deleted staff (count matches the DB); B's list only B's.
- Organization deactivated → staff caller 401, developer 200.
- `tsc` clean; no errors in the API log.

**Not yet**: Staff screens (layer 11); the `/api` route still blocks organization hosts (opened in 11).

## Layer 11 — Staff UI ✅ (2026-10-01)

**What exists now** (`stark-frontend`)
- `src/types/staff.ts` — `Staff`, `CreatableRole`, W-Mode labels (NONE, COMMAN, WHATSAPP, CALLING).
- `src/lib/staff.ts` — `listStaff(token)`, `listCreatableRoles(token)` (server), `createStaff(input)`
  (browser, via `/api`).
- `src/components/staff/staff-form-fields.ts` — the "Staff" modal fields (Role options = the roles the
  user may give, after "Select Role").
- `src/components/staff/staff-table.tsx` — legacy-look list (Sr, Party Name, Role, Username, W-Mode,
  Mobile, Address, Agent "-", Active Yes/No, Updated By, Updated Date, inert Action), Search, Add (F2),
  refresh after saving.
- `src/app/site/[orgId]/(app)/staff/page.tsx` — loads staff + creatable roles on the server; 404 for
  roles that can't manage staff.
- `src/proxy.ts` — `/api/*` forwards on organization hosts; unknown host → 404 JSON.

**Verified** (your dev server and API; temporary organization `l11.localhost:3000` with SUPERADMIN,
ADMIN, ADMIN DATA ENTRY OPERATOR — all removed afterwards with every test session; sequences restored)
- Developer: Staff ▾ → Staff ("Staff · L11 DELTA"), headers as specified, rows newest first; F2 opens
  "Staff"; Role options = Select Role + SUPERADMIN…TALLY OPERATOR (9); W-Mode NONE…CALLING; empty
  Save → required messages; duplicate username (other case) → "Username is already taken" under the
  field, modal open; fixed username → saved, list refreshed with "PRIYA SHARMA STAFF A/C · SUPERADMIN ·
  p.sharma · WHATSAPP · SECTOR 5 · Yes · developer" on top; search filters / "No records found";
  `/api/organizations` from the organization site → 403.
- SUPERADMIN: Role options ADMIN…TALLY OPERATOR (8); created an ADMIN, who then signs in and sees
  Staff. ADMIN: options MANAGER…TALLY OPERATOR (7); created a MANAGER.
- ADMIN DATA ENTRY OPERATOR: no Staff menu; `/staff` → 404; `/api/staff` GET/POST → 403.
- The list fits a 1280-px window without horizontal scrolling; no console errors.
- Main-app browser suite re-run: unchanged. Unknown host `/api/staff` → 404.
- `tsc` clean; lint 0 errors.

**Not yet**: end-to-end verification & docs (layer 12).
