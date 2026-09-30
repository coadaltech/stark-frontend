# 12 — End-to-end verification & docs

**Goal:** the full brief flow works and is documented.

**Scope**
- Walk the brief's steps 1–9 in the browser: developer seed → main-app login → create organization →
  set domain (`<name>.localhost:3000`, Domain ON) → sign in at the organization site → add a
  superadmin → superadmin signs in and adds staff → staff with web login signs in.
- Security checks: cross-site tokens, cross-organization staff access, role escalation attempts.
- Update `../001_Auth_Org_Sites_Staff.md` to "built" with anything that changed.

**Depends on:** 01–11
**Done when:** every step passes and the spec reflects what was built.
