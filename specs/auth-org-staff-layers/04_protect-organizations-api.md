# 04 — Protect the organizations API

**Goal:** organization management is developer-only at the API.

**Scope**
- Guard all `/organizations/*` routes (list, get, create, update/all tabs): signed-in **DEVELOPER**
  only (401 not signed in, 403 other roles).
- `AddedBy` / `UpdatedBy` = signed-in username.
- `POST /organizations` calls `assign_default_roles(<new id>)` in the same transaction.

**Depends on:** 03
**Done when:** without a token → 401; with a developer token everything works as before; a new
organization gets its 14 roles.
