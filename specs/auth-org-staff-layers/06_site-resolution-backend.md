# 06 — Site resolution (backend)

**Goal:** the API can tell which site a host belongs to.

**Scope**
- `MAIN_APP_HOST` env (e.g. `localhost:3000`).
- Public endpoint: given a host → `{ kind: "main" }`, `{ kind: "organization", organizationId, name }`
  or 404. Organization match: `lower(host) = OrganizationDomainURL` (port included in dev),
  `OrganizationOnDomain = 1`, not deleted.

**Depends on:** 01
**Done when:** curl checks for main host, a Domain-ON organization, Domain-OFF, unknown host.
