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
