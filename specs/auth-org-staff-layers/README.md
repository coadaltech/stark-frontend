# Auth, organization sites & staff — build layers

Source spec: `../001_Auth_Org_Sites_Staff.md`. Layers are executed **in order**, one at a time; each
ends in a working, tested state. Status: ⬜ not started · 🟨 in progress · ✅ done.

| # | Layer | Area | Status |
|---|---|---|---|
| 01 | [Database foundations](01_database-foundations.md) | DB | ✅ |
| 02 | [Developer seed](02_developer-seed.md) | DB / script | ✅ |
| 03 | [Backend auth core](03_backend-auth-core.md) | Backend | ✅ |
| 04 | [Protect the organizations API](04_protect-organizations-api.md) | Backend | ✅ |
| 05 | [Main-app sign-in (frontend)](05_main-app-sign-in-frontend.md) | Frontend | ✅ |
| 06 | [Site resolution (backend)](06_site-resolution-backend.md) | Backend | ✅ |
| 07 | [Multi-site routing (frontend)](07_multi-site-routing-frontend.md) | Frontend | ✅ |
| 08 | [Site-bound sign-in](08_site-bound-sign-in.md) | Backend + Frontend | ✅ |
| 09 | [Organization site shell & Organization-Info](09_org-site-shell-and-info.md) | Backend + Frontend | ✅ |
| 10 | [Staff API](10_staff-api.md) | Backend | ✅ |
| 11 | [Staff UI](11_staff-ui.md) | Frontend | ✅ |
| 11a | [Edit Staff](11a_edit-staff.md) (added 2026-10-01) | Backend + Frontend | ✅ |
| 12 | [End-to-end verification & docs](12_end-to-end-verification.md) | All | ⬜ |

Milestones:
- **After 05:** the developer signs in on the main app and manages organizations (only developers can).
- **After 08:** each organization is reachable at its own domain with its own sign-in.
- **After 11:** developer / superadmin / admin manage staff inside an organization site.
