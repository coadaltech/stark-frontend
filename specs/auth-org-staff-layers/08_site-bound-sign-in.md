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

**Decisions (answered before building)**
- After a correct password: organization deactivated → "This organization is inactive. Please contact
  your administrator." (403); role with `IsWebLogin = 0` → "Your role can't sign in on the web." (403).
  Wrong password / other organization's staff stay generic (401).

**Decided while building**
- Session site = host + organization id (`auth_session.SiteOrganizationId`, token `sorg`); `org` stays
  the account's organization. Login **and refresh** take `Host`.
- Signed-in organization page is a placeholder (header with Logout + "Signed in as …") until layer 09.
- **Refresh race fix** (affects all sites, found while testing): parallel refreshes in the grace window
  now receive the same current refresh token (rebuilt from `auth_session.Rotation` + `ExpiresAt`,
  token claim `rot` replaces the random `jti`) instead of rotating again — previously a third parallel
  refresh (page + prefetches after the access token expired) was treated as token theft and signed the
  user out.
- The proxy doesn't touch cookies on the sign-in form submission (server action POST to `/login`).
