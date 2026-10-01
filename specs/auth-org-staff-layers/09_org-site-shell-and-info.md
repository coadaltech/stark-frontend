# 09 — Organization site shell & Organization-Info

**Goal:** a signed-in user sees the organization's home page.

**Scope**
- API: Organization-Info for the site's organization (name, id, total staff).
- Organization-site layout: header (signed-in user + Logout), nav **Organization-Info** tab +
  **Staff ▾** (menu only for DEVELOPER, SUPERADMIN, ADMIN; items wired in 11).
- Organization-Info page: name, id, total staff.

**Depends on:** 08
**Done when:** signing in at an organization site shows its name, id and staff count; the Staff menu
appears only for DEVELOPER/SUPERADMIN/ADMIN.

**Decisions (answered before building)**
- Total staff = every non-deleted account of the organization (`RecordStatus <> 'D'`), active and
  inactive; developers never count.
- Staff ▾ (DEVELOPER, SUPERADMIN, ADMIN) → "Staff" → `/staff`, a "Staff list is coming soon"
  placeholder until layer 11. Other roles: no menu, `/staff` → 404.
- Organization-Info layout: white panel with label/value rows (ID, Name, Total Staff).

**Decided while building**
- API `GET /site/organization-info` behind a new `organizationSiteGuard`: on every call it checks the
  session, that the site still exists for the organization, and that the account is still allowed
  (§5.2) — so deactivation / Domain OFF cut off still-valid access tokens immediately. A main-app
  token → 403. The organization is always the token's site organization, never a parameter.
- Shared sign-in rules moved to `stark-backend/src/auth/access.ts` (used by auth and the guard).
- Unknown paths on an organization site → 404 (the layer-07/08 catch-all placeholder is gone).
