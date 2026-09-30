# 05 — Main-app sign-in (frontend)

**Goal (milestone):** the developer signs in on the main app and uses the organizations screens.

**Scope**
- `/login` page (theme-matched), login/logout **server actions**, httpOnly cookies
  (`SameSite=Lax`, host-only, `Secure` in production).
- `proxy.ts`: valid session → continue; expired → silent refresh; none → `/login?next=…`;
  signed-in on `/login` → `/`.
- `requireSession()` in the layout and every page; server fetches forward the token.
- `/api/[...path]` route forwarding browser calls with the token (refresh if needed; `/api/auth/*`
  blocked); `api()` uses `/api` in the browser.
- Header: signed-in role + username; avatar menu with name and **Logout**.
- Env: `API_URL`, shared `JWT_ACCESS_SECRET`.

**Depends on:** 03, 04
**Done when:** browser tests pass — signed-out redirects, wrong/right login, httpOnly cookies, org
list/add/edit work through `/api`, silent refresh, logout; non-developer can't get in.
