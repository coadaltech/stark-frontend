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
