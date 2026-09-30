# 05 — Main-app sign-in (frontend)

**Goal (milestone):** the developer signs in on the main app and uses the organizations screens.

**Scope**
- `/login` page (theme-matched), login/logout **server actions**, httpOnly cookies
  (`SameSite=Lax`, host-only, `Secure` in production).
- `proxy.ts`: access token not near expiry → continue; expired → silent refresh; none →
  `/login?next=…`; signed-in on `/login` (confirmed by the API) → `/`.
- `requireSession()` in the layout and every page — confirmed by the API (`GET /auth/me`); server
  fetches forward the token.
- `/api/[...path]` route forwarding browser calls with the token (refresh if needed; `/api/auth/*`
  blocked); `api()` uses `/api` in the browser.
- Header: signed-in role + username; avatar menu with name and **Logout**.
- Env: `API_URL` only (no JWT secret in the frontend).

**Depends on:** 03, 04
**Done when:** browser tests pass — signed-out redirects, wrong/right login, httpOnly cookies, org
list/add/edit work through `/api`, silent refresh, logout; non-developer can't get in.

**Decisions (answered before building)**
- Session ends while a page is open → any 401 from `/api` sends the browser to
  `/login?next=<current page>` (full page load).
- Login look → white "Sign in" card inside the teal app frame (XYZ brand, "Need Help?" footer).
- Logout → avatar menu (name, `username · role`, Logout); role pill + username stay in the header.
- `next` after login only accepts same-app paths (`/…`, not `//…` or `/login…`); anything else → `/`.
- ~~The frontend verifies access tokens locally (shared `JWT_ACCESS_SECRET`)~~ — **changed after the
  layer was built (2026-09-30):** the frontend holds no JWT secret. It asks the API (`GET /auth/me`,
  once per page request) and only accepts `site = "main"`; `proxy.ts` / `/api` read the token's `exp`
  only to time refreshes. `/api` refreshes and retries once when the API answers 401. API unreachable
  → error page (`src/app/error.tsx`) / 502, cookies kept.
