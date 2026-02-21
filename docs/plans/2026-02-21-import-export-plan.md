# Import/Export Plan

Last updated: 2026-02-21

## Goal
Add import/export for builder teams using compact versioned codes, with safe validation and clear UX.

## Locked Decisions
- Prefixes:
  - Single team export: `t1.`
  - Multi-team export: `mt1.`
- Export entry points:
  - Team row/card: export that team.
  - Teams header: export all teams.
- Import entry point:
  - Import button next to `+ Add Team`.
- Import behavior:
  - `mt1.` import: confirm first, then replace current builder setup.
  - `t1.` import: add as new team (must stay <= 10 teams).
- Single-team duplicate handling modal:
  - `Move to imported team`
  - `Skip duplicates and import`
  - `Cancel`

## Validation Rules
- Reject unknown/missing prefix.
- Reject unsupported version.
- Reject malformed/corrupted code.
- Reject unknown IDs (awakener/wheel/posse/covenant).
- Enforce max teams (`<= 10`).
- Enforce builder/team rules after decode.
- Import applies atomically (all-or-nothing).

## Scope Note (Wheel UI)
- For this import/export phase, wheel picker UI wiring in Builder is intentionally deferred.
- Required for this phase:
  - wheel IDs must be serialized/deserialized in codes,
  - wheel IDs must be validated against `wheels-lite.json` on import.
- Not required for this phase:
  - full wheel picker rendering/assignment UX in builder sidebar.

## Implementation Steps
1. [x] Add domain codec module (`encode/decode`) for `t1.` and `mt1.` with schema validation.
2. [x] Add import planner utility (replace vs append, duplicate detection, strategy application).
3. [x] Add UI dialogs:
   - Import code modal (paste + submit)
   - Export code modal (auto-select text)
   - 3-option duplicate strategy modal
4. [x] Wire export actions:
   - Team row export button
   - Teams header export-all button
5. [x] Wire import flow:
   - open import modal
   - decode + validate
   - multi-team replace confirm
   - single-team duplicate strategy modal when needed
6. [x] Add/import toasts for success and failure states.
7. [x] Add/adjust tests for codec, planner, and BuilderPage integration flows.
8. [x] Doc update in README + roadmap once feature lands.

## Edge Cases
- Empty import input.
- `t1.` import when already at 10 teams.
- `mt1.` payload with >10 teams.
- Duplicate team names in import payload.
- Missing optional fields in payload (fallback/sanitize).
- Future format evolution path (`t2.` / `mt2.`).

## Current Status
- Done:
  - Planning and requirements alignment.
  - `t1.`/`mt1.` codec + validation.
  - Import planner with replace/strategy branches.
  - Import/export UI wiring in Builder page.
  - Team-row and export-all entry points.
  - Integration tests for single-team and multi-team import flows.
- Pending:
  - Final commit/ship cleanup.
