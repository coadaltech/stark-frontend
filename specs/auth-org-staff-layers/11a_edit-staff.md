# 11a — Edit Staff (added after layer 11)

**Goal:** the staff row's **Action** button opens an "Edit Staff" modal, like Edit Organization.

**Decisions (answered before building, 2026-10-01)**
- Tabbed modal like Edit Organization; each tab saves on its own: **Info** and **Active/Deactive**.
- Editable: Staff Name, Role, W-Mode, Mobile, Address, and Active/Deactive. **Not** editable: Username,
  Password.
- Permissions: only staff **strictly below your own role** (same rule as creating) — never yourself
  or your peers. Others show the modal with "You can only edit staff below your own role."
- Deactivating signs the staff member out everywhere at once (all their sessions revoked).

**Decided while building**
- API: `GET /staff/:id` (+ `canEdit` for the caller), `PATCH /staff/:id` (partial; `staffManagerGuard`).
  Not in the organization / deleted → 404; at or above the caller → 403; a **new** role must be one the
  caller may give (422 "You can't give this role"); keeping a current role the caller couldn't give
  (e.g. legacy DISTRIBUTOR) is allowed. Unknown fields (Username, Password) are ignored.
- Name shown without " STAFF A/C" in the form; re-added on save (never doubled).
- Deactivation revokes sessions with reason `deactivated` in the same transaction; role/profile
  changes apply on the user's next page load (the session check reads the account each time).
- Reactivating doesn't restore old sessions; the user signs in again.
- `components/detail-loader.tsx`: generic loader (loading / error + Retry) now used by Edit
  Organization and Edit Staff.
