# 001 — Auth, organization sites and staff

Status: **planned** — requirements agreed 2026-09-29; nothing built yet.
Brief: `stark/specs/build/Auth.md` (the only source; `Staff-Org-link.md` is obsolete).
Starting point: frontend `d40bd20`, backend `6295f93` (organizations incl. Edit tabs; no auth, no staff).

---

## 1. Summary

One platform, two kinds of site, both behind sign-in:

| | **Main app** (platform) | **Organization site** (the organization's own domain) |
|---|---|---|
| Address | configured host, e.g. `localhost:3000` | the organization's `OrganizationDomainURL`, e.g. `acme.localhost:3000` (dev) / `lgaikhai.com` (prod) |
| Who can sign in | **DEVELOPER only** | DEVELOPER (any organization), or an account of **that** organization whose role has `IsWebLogin = 1` |
| Nav | Dashboard + Organizations ▾ (Organization) | **Organization-Info** + Staff ▾ (Staff) |
| Pages | Dashboard (empty), Organizations list / Add / Edit (all tabs) | Organization-Info (name, id, total staff); Staff list + Add Staff modal |
| Staff | not available | only here; new staff get **this** organization's id |

## 2. Can a domain open an organization? — Yes (approach)

A domain shows whatever server it points to, so **every organization domain points to the same
single app**, which decides what to show from the address it was reached at:

1. **DNS** (production): the customer points their domain (A/CNAME record) at our server. Nothing is
   deployed per organization.
2. **Host header:** every request carries the address it was sent to (`Host: lgaikhai.com`).
   `proxy.ts` resolves it: the main host → main app; a saved organization domain (Domain ON) →
   that organization's site; anything else → **"Site not found"** (404).
3. **Isolation:** a sign-in (token + cookies) belongs to one site; the API rejects it elsewhere, and
   staff operations are limited to the site's organization.

### Development: subdomains of `localhost`
Browsers (Chrome, Edge, Firefox) resolve any `*.localhost` name to this machine, so the single Next
app on port 3000 serves every site — nothing extra to run, and each subdomain gets its own cookies
(cookies are separated by host, **not** by port, which is why port-based sites were rejected).
- Main app: `http://localhost:3000`
- An organization: set its Domain URL to `acme.localhost:3000` (Domain ON), then open
  `http://acme.localhost:3000`.
- Safari may need a hosts-file entry (`127.0.0.1 acme.localhost`).

### Production (customer-owned domains) — deployment notes, not built now
- Customer creates the DNS record; the domain is saved on the organization (Domain tab).
- A reverse proxy in front of Next (e.g. Caddy) terminates HTTPS with **automatic per-domain
  certificates**, restricted to domains that exist in our database (on-demand TLS "ask" check), and
  passes the original `Host` header through.

## 3. Roles

RoleIds stay as seeded (`sys_role` / `role`): 1 DEVELOPER, 2 SUPERADMIN, 3 DISTRIBUTOR, 4 RETAILOR,
5 FANTER, 6 CASH AGENT, 7 ADMIN, 8 MANAGER, 9 MARKETER, 10 AUDITOR, 11 ADMIN DATA ENTRY OPERATOR,
12 DATA ENTRY OPERATOR, 13 ADMIN TALLY OPERATOR, 14 TALLY OPERATOR.

**Priority** (highest first) is separate from the ids and must be stored explicitly:

DEVELOPER > SUPERADMIN > ADMIN > DISTRIBUTOR > RETAILOR > FANTER > CASH AGENT > MANAGER > MARKETER >
AUDITOR > ADMIN DATA ENTRY OPERATOR > DATA ENTRY OPERATOR > ADMIN TALLY OPERATOR > TALLY OPERATOR

**Creating staff** — only DEVELOPER, SUPERADMIN and ADMIN; each creates roles **strictly below**
itself; DISTRIBUTOR, RETAILOR, FANTER, CASH AGENT are **never** creatable (not in the dropdown):

| Signed-in role | Can create |
|---|---|
| DEVELOPER | SUPERADMIN, ADMIN, MANAGER, MARKETER, AUDITOR, ADMIN DATA ENTRY OPERATOR, DATA ENTRY OPERATOR, ADMIN TALLY OPERATOR, TALLY OPERATOR |
| SUPERADMIN | ADMIN, MANAGER, MARKETER, AUDITOR, ADMIN DATA ENTRY OPERATOR, DATA ENTRY OPERATOR, ADMIN TALLY OPERATOR, TALLY OPERATOR |
| ADMIN | MANAGER, MARKETER, AUDITOR, ADMIN DATA ENTRY OPERATOR, DATA ENTRY OPERATOR, ADMIN TALLY OPERATOR, TALLY OPERATOR |
| others | — |

DEVELOPER is never created through the UI (seed only).

**Web sign-in** follows the legacy per-organization flag `role.IsWebLogin` (defaults: 1, 2, 7, 11 →
DEVELOPER, SUPERADMIN, ADMIN, ADMIN DATA ENTRY OPERATOR). Staff with other roles can be created but
cannot sign in yet. DEVELOPER has no organization (so no role row) and is **always allowed**.

## 4. Data

### 4.1 `login` (accounts)
- `OrganizationId` is now **nullable**: `NULL` = platform account (DEVELOPER); otherwise the
  organization the staff member belongs to (one organization → many staff).
- **Usernames** (`sql/005_login_username_unique.sql`, decided 2026-09-30):
  - unique **per organization**, ignoring case, among non-deleted logins — index
    `login_org_username_key` on `(OrganizationId, lower(UserName)) NULLS NOT DISTINCT`, so the same
    username may exist in different organizations, and developers (NULL) are unique among themselves;
  - **developer usernames are reserved platform-wide** (trigger `login_reserve_developer_username`):
    no staff member in any organization may use a developer's username, and a developer can't take
    an existing staff username — sign-in at an organization site is never ambiguous. Violations raise
    a unique-violation (constraint name `login_developer_username_reserved`).
  - Legacy procedures that matched `login."UserName"` to `transaction."AddedBy"` now also match the
    organization (9 procedures, 15 joins); the others already reached `login` through the
    organization's ledgers.
- Staff columns and rules as in the earlier Staff design (§7).

### 4.2 Existing from earlier work (kept in the DB)
- 14 roles in `sys_role`; `role` rows for organization 1001; procedure `assign_default_roles(org)`;
  index `role_organization_role_key` (one role **definition** per organization and role type — any
  number of staff may hold a role); table `auth_session` (empty). The earlier platform-wide
  `login_username_key` was replaced by the per-organization rule in §4.1.
- These need SQL files in the repo again (they were removed with the code) so a fresh database gets
  them via `bun run db:sql`.

### 4.3 New organizations
`POST /organizations` calls `assign_default_roles(<new id>)` in the same transaction, so every
organization has its 14 roles (and `IsWebLogin` flags).

## 5. Auth (mechanism unchanged from the earlier agreement)

- **Hand-written HS256 JWTs** on Web Crypto; bcrypt via `Bun.password`; no third-party auth/JWT libs.
- **Access token 15 min**, **refresh token 7 days** (sliding), separate secrets.
- **`auth_session`** table: hashed refresh tokens, rotation on every refresh, 30 s grace for parallel
  refreshes, reuse → session revoked, per-session logout, account re-checked on refresh.
- **httpOnly cookies** set by Next (server action login); `proxy.ts` refreshes silently; every page
  checks the session server-side; browser calls go through the Next `/api/...` route with the token.
- **The frontend holds no JWT secret.** The Next server asks the API who is signed in
  (`GET /auth/me`, once per page request, shared by layout and page). `proxy.ts` and the `/api` route
  only read the token's `exp` (unverified) to decide when to refresh; the API judges every token. If the
  API can't be reached, pages show an error state and the cookies are kept (not treated as sign-out).
- **Case-insensitive usernames**; generic "Invalid username or password."; specific messages only
  after a correct password.
- Header shows the signed-in role + username; avatar menu with name and **Logout**.

### 5.1 New: sessions belong to a site
- One session per site: signing in at `acme.localhost` does not sign you in at `beta.localhost` or the
  main app (host-only cookies, no `Domain` attribute).
- Access and refresh tokens carry the **site** they were issued for (`site` = host, and `org` = the
  site's organization id, or none for the main app). The API rejects a token used for another site,
  and refresh keeps the same site.

### 5.2 Sign-in rules per site
| Site | Allowed |
|---|---|
| Main app | DEVELOPER only (organization NULL, role 1); anyone else → the generic "Invalid username or password." (401). An inactive developer (correct password) → "Your account is inactive…" (403). |
| Organization site | DEVELOPER; or `login.OrganizationId` = that organization, account active (`AccountStatus '1'`, not deleted), role `IsWebLogin = 1`, **and** organization active (`IsOrganizationAllow '1'`). Staff of another organization are rejected. |

Refresh re-applies the same rules (e.g. deactivating the organization signs its staff out within
15 minutes; the developer is unaffected).

### 5.3 Site resolution
- `MAIN_APP_HOST` (env, e.g. `localhost:3000`) is the main app.
- An organization site matches when `lower(Host)` equals the organization's `OrganizationDomainURL`
  **including the port in development**, `OrganizationOnDomain = 1`, and the organization isn't
  deleted.
- Otherwise → "Site not found" (404).
- The Next server has no DB access: `proxy.ts` asks the API (small public endpoint returning
  `{ kind: "main" | "organization", organizationId, name }` or 404) and caches answers briefly.

### 5.4 Developer seed
`bun run db:seed:developer` reads `DEVELOPER_USERNAME` / `DEVELOPER_PASSWORD` from the backend
`.env`, creates a DEVELOPER (RoleId 1) with `OrganizationId NULL`, bcrypt password, fixed
`LoginName "DEVELOPER"` and `Mobile "0000000000"`, `LedgerId 0`; idempotent (an existing developer
with that username — any case — is never changed). Refuses: missing values, username with spaces or
> 30 chars, password outside 8–72 chars or equal to the `.env.example` placeholder, and a username
already used by staff (reserved-username trigger).

## 6. API permissions (enforced server-side)

| Area | Rule |
|---|---|
| `/auth/*` | public (login needs the site; refresh/logout use the refresh token) |
| Site lookup | public |
| `/organizations/*` (list, get, create, update — all tabs) | **DEVELOPER on the main app** only |
| Organization-Info (name, id, total staff) | any signed-in user **of that organization site** |
| `/staff` list / roles / create | DEVELOPER, SUPERADMIN, ADMIN **on an organization site**; always scoped to the token's organization (never a client-sent id) |
| Staff create | role must be creatable by the caller (§3); `OrganizationId` = site organization |
| Audit | `AddedBy` / `UpdatedBy` = signed-in username |

## 7. Staff (same design as before)

| Form field | Column | Rules |
|---|---|---|
| Staff Name | `LoginName` | required; stored UPPERCASE + `" STAFF A/C"` (typed ≤ 70) |
| Role | `LoginType` | select limited to roles the signed-in user may create (§3) |
| W-Mode | `StaffWorkMode` | NONE 0, COMMAN 1, WHATSAPP 2, CALLING 3 |
| Username | `UserName` | required, ≤ 30, no spaces, unique **within the organization** (case-insensitive), not a developer's username, stored as typed |
| Password | `Password` | required, ≤ 72, bcrypt |
| Mobile | `Mobile` | exactly 10 digits |
| Address | `Address` | optional, ≤ 50, UPPERCASE |

Server-set: `OrganizationId` = site organization, `LedgerId 0`, `AccountStatus '1'`,
`RecordStatus 'A'`, audit = signed-in username. Agent not included (no ledgers yet).

**Staff list** (legacy look): Sr, Party Name, Role, Username, W-Mode, Mobile, Address, Agent (`-`),
Active (Yes/No), Updated By, Updated Date, Action — Search, Add (F2). **Add Staff** = the "Staff"
modal. **Action** is shown but does nothing in this build. The list shows only the site
organization's staff (developers have no organization, so they never appear).

## 8. Frontend structure

- **One Next app** serves both site kinds. `proxy.ts` resolves the host, then:
  - main host → the existing main-app routes (`/`, `/organizations`, `/login`);
  - organization host → **rewrites** to internal organization routes (e.g. `/` → `/site/<orgId>`,
    `/staff` → `/site/<orgId>/staff`, `/login` → `/site/<orgId>/login`); those internal paths are not
    reachable directly from the main host (404);
  - unknown host → "Site not found".
- Session refresh and redirects to the site's own `/login?next=…` as before.
- **Main app:** Dashboard (empty) + Organizations ▾ → Organization (developer only).
- **Organization site:** Organization-Info (home) + Staff ▾ → Staff (Staff menu only for DEVELOPER,
  SUPERADMIN, ADMIN); header with signed-in user + Logout.
- **Login page** per site, theme-matched; the organization site's login shows the organization name.

## 9. Configuration
- Backend `.env`: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥ 32 chars), `DEVELOPER_USERNAME`,
  `DEVELOPER_PASSWORD`, `MAIN_APP_HOST`.
- Frontend `.env.local`: `API_URL`, `MAIN_APP_HOST` (no JWT secret — see §5).

## 10. Decisions log
1. Development sites use `*.localhost` subdomains (not ports).
2. Production organization domains are customer-owned.
3. Main app = configured host; unknown hosts → "Site not found".
4. DEVELOPER accounts have `OrganizationId NULL`; seeded via env; always allowed to sign in.
5. Developer creates every organization role except DEVELOPER (incl. SUPERADMIN).
6. Adding staff: DEVELOPER, SUPERADMIN, ADMIN only, strictly below own role by priority; DISTRIBUTOR,
   RETAILOR, FANTER, CASH AGENT never creatable.
7. Web sign-in requires `role.IsWebLogin = 1` (legacy defaults: 1, 2, 7, 11).
8. Organization site works only with Domain ON; staff can't sign in while the organization is Deactive.
9. Staff fields/rules as in the earlier Staff design; Add Staff is a modal; list + Add only.
10. Organization site nav: Organization-Info + Staff only; Staff visible to DEVELOPER/SUPERADMIN/ADMIN.
11. Separate session per site; tokens bound to their site.
12. Main-app Dashboard stays empty.
13. Domain matched against the full host, including the port in development.
14. Auth mechanism (JWT, sessions, cookies, proxy, /api route) as agreed earlier.
15. Role priority and staff-creatability stored on `sys_role` (`RolePriority`, `IsStaffCreatable`).
16. Usernames unique per organization; developer usernames reserved platform-wide.
17. The frontend holds no JWT secret; it confirms sessions with the API (`GET /auth/me`) — chosen over
    a shared HS256 secret (would let the frontend mint tokens) and public-key signing.

## 11. Not in this build
- Editing staff, activating/deactivating staff, deleting staff.
- Staff ledgers / Agent.
- Changing `IsWebLogin` per role; forced password change; password reset; login rate limiting.
- Production reverse proxy / TLS setup (documented in §2 only).
- Main-app dashboard content.
