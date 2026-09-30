# 07 — Multi-site routing (frontend)

**Goal:** one Next app serves the main app and every organization site by host.

**Scope**
- `proxy.ts` resolves the host via 06 (no cache — see decisions):
  main host → main routes; organization host → **rewrite** to internal `/site/[orgId]/…` routes;
  unknown host → "Site not found" page.
- Internal `/site/…` routes not reachable from the main host; main routes not reachable from
  organization hosts.
- Placeholder organization-site pages (filled in 08/09).

**Depends on:** 05, 06
**Done when:** `localhost:3000` → main app; `acme.localhost:3000` (Domain ON) → organization site
placeholder; Domain OFF or unknown host → "Site not found".

**Decisions (answered before building)**
- Until organization-site sign-in exists (08), every path on an organization host shows a public
  placeholder: the organization's **name only** + "Sign-in for this site is coming soon."
- The frontend has **no `MAIN_APP_HOST`**: the API (`/sites/resolve`) decides for every host.
- **No cache** for host lookups: every page request and `/api` call asks the API (domain changes show
  immediately).
- `/api/*` works on the main host only for now; organization/unknown hosts → 404 JSON.
- API unreachable during host lookup → the error page (500) / `/api` → 502.
- `next.config.ts`: `allowedDevOrigins: ["*.localhost"]` so subdomain sites load dev assets.
