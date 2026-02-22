# Persistence Plan

Last updated: 2026-02-22

## Goal
Add reliable client-side persistence for:
1. Builder draft state (teams, slots, wheels, covenants, posse, active team).
2. Owned/unowned collection state (awakeners, wheels, posses), likely on a dedicated page/tab.

This should survive refresh/reopen while keeping a clean path for a future backend account system if that ever happens.

## Why This Plan
- We are frontend-only right now.
- Users need "come back later" behavior without manual import/export every session.
- We do not want persistence logic hardwired into UI components.

## Locked Decisions
- Use browser storage first; no backend dependency for MVP.
- Keep builder persistence and collection ownership as separate storage domains/keys.
- Preserve current import/export as a sharing tool, not the primary persistence mechanism.
- Build behind a storage adapter so backend sync can be added later with minimal churn.
- Builder restore scope is team draft data only (teams + active team). Picker filters/search are not persisted for now.
- No explicit "autosave enabled" badge for MVP; silent autosave is sufficient unless users report confusion.
- Collection ownership should have a future export/import path for backup and cross-device sync use cases.

## Storage Strategy (Recommended)
1. Primary: `localStorage` for MVP.
2. Data shape: versioned envelopes (`version`, `updatedAt`, `payload`).
3. Write behavior:
   - debounce writes (avoid write spam while dragging),
   - only write when relevant state changes.
4. Read behavior:
   - hydrate once on page load,
   - validate payload shape,
   - fall back safely on corrupt data.
5. Migration:
   - explicit migration map per version (`v1 -> v2`).

## Data Domains
### A) Builder Draft State
- `teams[]`
- `activeTeamId`

### B) Collection Ownership State
- `ownedAwakeners: Record<awakenerId, boolean>`
- `ownedWheels: Record<wheelId, boolean>`
- `ownedPosses: Record<posseId, boolean>`
- optional metadata:
  - `lastUpdatedAt`,
  - `dupeLevels`, (how many copies of each awakener/wheel one owns)
  - `source` (manual/imported).

## Proposed Keys
- `skeydb.builder.v1`
- `skeydb.collection.v1`

## UX Expectations
- Builder auto-restores previous draft on load (silent restore).
- Optional "Reset builder data" action clears only builder key.
- Builder picker should support a global `Display Unowned` toggle (applies across all picker tabs).
- Picker items should visually indicate owned vs unowned states when ownership data exists.
- Collection page gets:
  - quick toggle owned/unowned,
  - clear collection data action.
- Team import must remain non-blocking even if imported entries are unowned.
- When imported teams contain unowned entries, team cards/slots should display clear visual cues so replacement decisions are easy.
- Future:
  - export/import collection state as compact code/json for backup/sync.

## Guardrails
- Never block page render on storage errors.
- Wrap parse/write in safe try/catch with soft-fail behavior.
- Keep validation strict enough to reject malformed payloads.
- Do not persist ephemeral drag/hover state.

## Implementation Steps
1. [ ] Add storage adapter layer:
   - `read(key)`, `write(key, value)`, `remove(key)` with safe error handling.
2. [ ] Add builder persistence service:
   - serialize/deserialize + schema validation + version tag.
3. [ ] Wire builder hydration on mount.
4. [ ] Wire debounced builder autosave on state changes.
5. [ ] Add reset action and tests for builder persistence behavior.
6. [ ] Define collection ownership domain types and persistence service.
7. [ ] Build collection UI tab/page (separate from builder) and wire ownership persistence.
8. [ ] Add migration scaffolding (`v1` baseline + migration registry).
9. [ ] Update README/roadmap after release.

## Out of Scope (This Phase)
- Cloud sync / login/account linkage.
- Multi-device synchronization.
- Full backup history/version browser.
- Cookie-based persistence (not needed for this use case).

## Open Questions
- Exact visual language for unowned entries (badge, tint, icon overlay, or combined treatment).
- Whether the global `Display Unowned` toggle defaults to on or off when ownership data exists.
