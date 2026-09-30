# 03 — Backend auth core

**Goal:** the API can sign in, refresh, sign out and identify the user — for the **main app only**
for now (site binding comes in 08).

**Scope**
- Hand-written HS256 JWT sign/verify (Web Crypto); access 15 min / refresh 7 days, separate secrets
  (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, ≥ 32 chars; startup fails otherwise).
- `auth_session` handling: hashed refresh tokens, rotation, 30 s grace, reuse → revoke, per-session
  logout, account re-check on refresh.
- `POST /auth/login` (case-insensitive username, generic bad-credentials message, timing-safe),
  `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- Main-app sign-in rule: **DEVELOPER only**; others → "This account can't sign in here."
- Reusable guard plugin (Bearer token + active session → typed `user`).
- **Decided:** keep the existing JWT secrets in `.env`; tokens and sessions carry `site = "main"` from
  now on (`auth_session."Site"`); a non-developer with a correct password gets the **generic**
  "Invalid username or password." (401); no repo tests (scripted checks outside the repo).

**Depends on:** 01, 02
**Done when:** curl checks pass — developer logs in; non-developer refused; refresh rotates; replayed
old token revokes the session; logout takes effect immediately; tampered/expired tokens rejected.
