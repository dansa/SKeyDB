# Plan 008b: Extract Builder V2 Team Management Commands

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. The reviewer maintains `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/006-narrow-builder-v2-dnd-command-port.md`,
  `plans/008a-extract-builder-v2-persisted-preferences.md`
- **Category**: tech-debt
- **Planned at**: commit `ca0361cf`, 2026-06-18

## Why This Matters

`useBuilderV2Model.ts` still owns team add/select/rename/delete/reset/template
and reorder command plumbing. These commands have different reasons to change
than picker preferences, slot loadout assignment, or import/export. Extracting
them behind a local hook keeps the model hook moving toward a composer without
changing the exported `BuilderV2Model` shape.

## Scope

**In scope**:

- `src/features/builder-v2/useBuilderV2Model.ts`
- New local hook/module under `src/features/builder-v2/`, expected name
  `useBuilderV2TeamManagementCommands.ts`
- Focused model tests only if extraction exposes an untested transient cleanup
  behavior

**Out of scope**:

- Active-team slot loadout commands such as `swapTeamSlots`,
  `assignAwakenerToTeamSlot`, `assignWheelToTeamSlot`,
  `assignCovenantToTeamSlot`, `clearTeamSlot`, `moveTeamWheel`, or
  `moveTeamCovenant`.
- Import/export dialog extraction.
- Preference storage.
- Route, UI layout, DnD behavior, persistence keys, or public model shape
  changes.

## Steps

### Step 1: Extract team-management command ownership

Create `useBuilderV2TeamManagementCommands.ts` and move ownership for:

- `setActiveTeam`
- `clearTeamTransientState`
- `applyDeleteTeam`
- `applyResetTeam`
- `addTeam`
- `beginTeamRename`
- `commitTeamRename`
- `cancelTeamRename`
- `requestDeleteTeam`
- `requestResetTeam`
- `requestApplyTeamTemplate`
- `moveTeamUp`
- `moveTeamDown`
- `moveTeamToIndex`
- `cancelTeamAction`
- `confirmTeamAction`
- `teamActionDialog`
- `pendingTeamAction` state, if it can move cleanly with the dialog commands

Keep `setEditingTeamName`, `editingTeamId`, and `editingTeamName` sourced from
`builderDraftStore` as they are today, unless moving only the store selectors is
clearly simpler.

### Step 2: Preserve transient cleanup behavior

The extracted hook must preserve all current cleanup side effects:

- cancel quick-lineup when changing/clearing teams where current code does
- clear transfers
- clear pending team actions
- cancel team rename
- clear violation messages
- clear editing targets
- preserve active team id after reorder
- keep empty delete/reset direct paths and non-empty confirmation paths

### Step 3: Keep `useBuilderV2Model` as the composer

In `useBuilderV2Model.ts`, call the new hook and wire the returned commands into
the existing model return object. Do not change the exported `BuilderV2Model`
interface.

## Verification

- `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts --run`
- `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`
- `npm run format:check`
- `git diff --check`

## Done Criteria

- [ ] Team-management commands/dialog ownership is no longer directly in
      `useBuilderV2Model.ts`.
- [ ] Slot loadout assignment and transfer-heavy commands remain in the model
      hook for a later tranche.
- [ ] Public `BuilderV2Model` shape is unchanged.
- [ ] Existing Builder V2 model, page, and DnD tests pass.
- [ ] Typecheck, lint, format check, and diff whitespace checks pass.

## STOP Conditions

Stop and report if:

- The extraction requires changing `builderDraftStore` semantics.
- The public `BuilderV2Model` shape must change.
- The hook extraction pulls in slot loadout assignment or import/export behavior.
- Transient cleanup behavior becomes unclear or requires new product decisions.
- A verification command fails twice after reasonable fix attempts.
