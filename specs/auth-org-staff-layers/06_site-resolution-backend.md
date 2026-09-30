# 06 — Site resolution (backend)

**Goal:** the API can tell which site a host belongs to.

**Scope**
- `MAIN_APP_HOST` env (e.g. `localhost:3000`).
- Public endpoint: given a host → `{ kind: "main" }`, `{ kind: "organization", organizationId, name }`
  or 404. Organization match: `lower(host) = OrganizationDomainURL` (port included in dev),
  `OrganizationOnDomain = 1`, not deleted.

**Depends on:** 01
**Done when:** curl checks for main host, a Domain-ON organization, Domain-OFF, unknown host.

**Decisions (answered before building)**
- Domain URL format is validated again (API + Domain tab): a host name with an optional port
  (`lgaikhai.com`, `acme.localhost:3000`); no `http://`, path, spaces or trailing dot; port 1–65535.
  Stored trimmed and lower-cased. Existing values are checked the next time the Domain tab is saved.
- The main app host can't be saved as an organization domain ("This domain is reserved for the main app").
- Endpoint: `GET /sites/resolve?host=<host>` (public). `MAIN_APP_HOST` defaults to `localhost:3000`
  and must itself be a valid `host[:port]` (the API refuses to start otherwise).
- The organization's active flag (`IsOrganizationAllow`) doesn't affect resolution — a deactivated
  organization's site still opens (the developer can sign in; staff are blocked in layer 08).
