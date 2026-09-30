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
