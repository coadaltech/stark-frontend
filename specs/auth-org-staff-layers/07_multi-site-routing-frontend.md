# 07 — Multi-site routing (frontend)

**Goal:** one Next app serves the main app and every organization site by host.

**Scope**
- `proxy.ts` resolves the host via 06 (short in-memory cache):
  main host → main routes; organization host → **rewrite** to internal `/site/[orgId]/…` routes;
  unknown host → "Site not found" page.
- Internal `/site/…` routes not reachable from the main host; main routes not reachable from
  organization hosts.
- Placeholder organization-site pages (filled in 08/09).

**Depends on:** 05, 06
**Done when:** `localhost:3000` → main app; `acme.localhost:3000` (Domain ON) → organization site
placeholder; Domain OFF or unknown host → "Site not found".
