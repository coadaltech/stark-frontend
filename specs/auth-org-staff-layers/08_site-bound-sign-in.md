# 08 — Site-bound sign-in

**Goal:** each site has its own sign-in; tokens only work on the site they were issued for.

**Scope**
- Login takes the site (host resolved by the API); tokens carry `site` + `org`; sessions per site.
- Organization-site rules: DEVELOPER (any organization); or account of **that** organization, active,
  role `IsWebLogin = 1`, organization active (`IsOrganizationAllow '1'`). Refresh re-checks.
- API guard rejects tokens used on another site; organizations API stays main-app-only.
- Organization-site `/login` page (shows the organization name); proxy/refresh/redirects per site.
- Frontend session check (`GET /auth/me`) accepts the current site instead of the fixed `"main"`
  (`fetchSessionUser` in `src/lib/auth/tokens.ts`).

**Depends on:** 03, 05, 07
**Done when:** developer signs in separately on main and organization sites; cookies don't cross
sites; a token from one site is rejected on another; deactivating the organization blocks staff sign-in.
