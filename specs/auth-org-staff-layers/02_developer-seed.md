# 02 — Developer seed

**Goal:** a DEVELOPER account exists to sign in with.

**Scope**
- `bun run db:seed:developer` (backend script) reads `DEVELOPER_USERNAME` / `DEVELOPER_PASSWORD` from
  `.env`; creates a `login` row with RoleId 1 (DEVELOPER), `OrganizationId NULL`, bcrypt password,
  `LedgerId 0`, active; idempotent (never changes an existing account).
- **Decided:** fixed `LoginName "DEVELOPER"` and `Mobile "0000000000"`; credentials are set by the
  owner in `.env` (`.env.example` has placeholders).
- `.env` / `.env.example` entries (password never committed).

**Depends on:** 01
**Done when:** running the script twice creates exactly one developer account.
