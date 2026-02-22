# Multi-Team Builder Plan

Last updated: 2026-02-22

## Goal
Expand the builder from a single active team into a practical 1-10 team planner while preserving current UX quality and rule clarity.

## Locked Decisions
- No drag/drop of units between teams in this iteration.
- Switching active team is direct via team row click.
- Inactive teams render as compact rows below the active team area:
  - `Team Name | 4 portrait slots | Posse icon`.
- Inactive rows should match roughly the height of the current active-team header band.

## MVP Scope (In)
- Multi-team state model (`1-10` teams, one active team).
- Team CRUD basics:
  - add team (up to 10),
  - set active team (row click),
  - rename team (inline edit: hover icon, input with confirm/cancel, Enter/Escape),
  - delete team (centered confirm/cancel overlay; no native dialog) (guard when only one remains).
- Inactive team compact list UI with portraits + posse preview.
- Existing editor (`active team`) remains the only place where slot editing happens.
- Global uniqueness enforcement across all teams for:
  - awakener identity keys,
  - posse ID.
- Picker disabled/label behavior updated to reflect cross-team usage.
- Cross-team move confirmation flow for locked awakeners/posses (click + drag/drop where applicable).

## Out of Scope (for this pass)
- Cross-team character drag/drop.
- Complex cross-team bulk move workflows.
- Persistence/share format changes.

## UX Requirements
- Team row click switches active team.
- Drag handle is isolated to team reordering to avoid accidental reorder while selecting rows.
- Keep current toast/feedback style for invalid moves and rule violations.

## Data/State Refactor Plan
1. Introduce `Team` entity:
   - `id`, `name`, `slots`, `posseId`, order index.
2. Replace single-team page state with:
   - `teams[]`,
   - `activeTeamId`,
   - `selectedTeamId` (optional for row focus).
3. Add derived global usage indexes:
   - awakeners (identity-key based),
   - wheels,
   - posses.
4. Team-scoped actions:
   - assign/swap/clear slot,
   - assign/clear wheel,
   - set/unset posse,
   - rename/reorder/add/delete teams.

## Implementation Steps
1. [x] Refactor domain/team-state helpers for team-scoped operations + global uniqueness checks.
2. [x] Add tests for new team collection operations and uniqueness rules.
3. [x] Build inactive team row component (compact portraits + posse preview + actions).
4. [x] Wire active editor to `activeTeamId`.
5. [x] Update picker disable-state reasoning/messages with team context (`used by Team X`).
6. [x] Final polish and interaction QA (no accidental active-team switches during drag workflows).

## Current Status
- Done:
  - Multi-team model and active-team edit flow.
  - Team add/edit/delete with centered confirm/cancel delete confirmation.
  - Team inline rename UX (hover rename icon, inline input, Enter/Escape, confirm/cancel).
  - Inactive team rows below active team, with portrait + posse previews.
  - Global uniqueness enforced for awakener identities and posses.
  - Blocked posse labels (`Used in 1st team`) and descriptive invalid-move toasts.
  - Drag-reorder UX polish for team rows (explicit drag lane + stable active-state visuals).
  - Active-team switching via team row click.
  - Slot-click regression fix: clicking a picker entry for an already slotted awakener no longer moves it to the next empty slot.
- Pending:
  - Additional interaction polish + QA passes.
  - TODO: implement an `Expanded Teams` toggle that renders smaller-scale but full team cards (including wheels/covenants) for each team.

## Follow-up Bugs
- None currently tracked for this phase.

## Testing Strategy
- Unit tests:
  - team collection actions (add/remove/rename/switch),
  - global uniqueness validation across teams.
- Integration tests (`BuilderPage`):
  - explicit edit activation flow,
  - inactive row rendering,
  - picker disable behavior across teams.
- Verification gate:
  - `npm run verify` before commit.

## Success Criteria
- User can build and manage up to 10 teams without losing current active-team editing UX.
- Rule enforcement remains clear and consistent when multiple teams are present.
- No regressions in current builder interaction tests.
