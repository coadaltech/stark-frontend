# 10 — Staff API

**Goal:** staff can be listed and created inside an organization site, with the role rules enforced.

**Scope**
- `GET /staff`, `GET /staff/roles`, `POST /staff` — organization site only; organization always from
  the token; callers DEVELOPER, SUPERADMIN, ADMIN only.
- Creatable roles: strictly below the caller by priority; never DEVELOPER, DISTRIBUTOR, RETAILOR,
  FANTER, CASH AGENT (spec §3).
- Fields/rules from spec §7 (NAME + " STAFF A/C", W-Mode 0–3, username unique within the organization and not a developer's, bcrypt, 10-digit
  mobile, address); `OrganizationId` = site organization; `LedgerId 0`; audit = username.

**Depends on:** 08
**Done when:** curl checks for each caller role (allowed/forbidden roles), cross-organization
isolation, validation, duplicate usernames (same organization → rejected, other organization → allowed,
developer username → rejected).

**Decisions (answered before building)**
- Staff list: newest first.
- Usernames: 1–30 of letters, digits, `.`, `_`, `-` (no spaces); stored as typed.
- Mobile: exactly 10 digits, not unique.

**Decided while building**
- Creatable roles = `sys_role.IsStaffCreatable = 1`, `RolePriority` strictly below the caller's, and a
  non-deleted `role` row for the organization; returned highest first.
- `staffManagerGuard` (organization-site checks + DEVELOPER/SUPERADMIN/ADMIN) runs before validation:
  other roles get 403 even with an invalid body.
- Same username in the organization (any case) or a developer's username → 422
  `UserName: "Username is already taken"` (one message, so developer usernames aren't revealed);
  races are caught from the unique index / reservation trigger. A deleted account's username can be
  reused.
- A role the caller can't give → 422 `LoginType: "You can't create staff with this role"`.
- Password: 1–72 characters (no other policy in the spec).
