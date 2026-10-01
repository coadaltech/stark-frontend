# 11 — Staff UI

**Goal:** the Staff screens inside an organization site.

**Scope**
- Staff ▾ → Staff list (legacy look: Party Name, Role, Username, W-Mode, Mobile, Address, Agent "-",
  Active Yes/No, Updated By, Updated Date, Action inert) with Search and Add (F2).
- "Staff" Add modal; Role dropdown lists only the roles the signed-in user may create.
- Not shown on the main app.

**Depends on:** 09, 10
**Done when:** developer, superadmin and admin can each add staff with only their allowed roles; the
list refreshes; other roles don't see Staff.

**Decisions (answered before building)**
- Role dropdown starts at "Select Role" (Role is required, so it's always chosen explicitly).

**Decided while building**
- Modal "Staff": Staff Name · Role · W-Mode (NONE default) / Username · Password · Mobile / Address
  (optional). Client checks mirror the API (username characters, 10-digit mobile); server field
  errors (e.g. "Username is already taken") appear under the field and the modal stays open.
- List columns as specified; Agent "-"; Active Yes/No; Action button shown but inert
  ("Not available yet"). Search covers name, role, username, W-Mode, mobile, address, updated by.
- `/api` now forwards on organization hosts too (the API decides what an organization-site session
  may do); unknown hosts → 404 "Site not found".
