# Plan 008c: Extract Builder V2 Import/Export Adapter

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. The reviewer maintains `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: MED
- **Depends on**: `plans/008a-extract-builder-v2-persisted-preferences.md`,
  `plans/008b-extract-builder-v2-team-management-commands.md`
- **Category**: tech-debt
- **Planned at**: commit `f8ce2597`, 2026-06-18

## Why This Matters

`useBuilderV2Model.ts` still wires import/export dialogs directly even after the
preference and team-command extractions. Import/export has its own trust and
format boundaries, so moving this wiring into a local adapter keeps the model
hook closer to a composer without changing import/export behavior.

## Scope

**In scope**:

- `src/features/builder-v2/useBuilderV2Model.ts`
- New local hook/module under `src/features/builder-v2/`, expected name
  `useBuilderV2ImportExportAdapter.ts`

**Out of scope**:

- Transfer dialog extraction.
- Import/export format changes.
- Classic Builder import/export code.
- Route, UI layout, DnD behavior, persistence keys, or public model shape
  changes.

## Steps

### Step 1: Extract the import/export wiring

Create `useBuilderV2ImportExportAdapter.ts` and move out of
`useBuilderV2Model.ts`:

- `setTeamsForImportExport`
- `clearImportExportTransientState`
- the `useBuilderImportExport` call
- `openActiveTeamExportDialog`
- `openActiveTeamIngameExportDialog`

The adapter should return:

- `openImportDialog`
- `openExportAllDialog`
- `openTeamExportDialog`
- `openActiveTeamExportDialog`
- `openActiveTeamIngameExportDialog`
- `importExportDialogProps`

### Step 2: Preserve behavior exactly

Keep the transient cleanup behavior unchanged:

- finish quick-lineup
- clear editing target
- clear violation message
- clear transfer

Keep `setTeamsForImportExport` using the current `builderDraftStore` update
semantics so functional updates still receive the latest teams.

### Step 3: Keep the model hook as a composer

In `useBuilderV2Model.ts`, call the new adapter and wire the returned values
into the existing `BuilderV2Model` return object. Do not change the exported
`BuilderV2Model` interface.

## Verification

- `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts --run`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`
- `npm run format:check`
- `git diff --check`

## Done Criteria

- [ ] Import/export wiring is no longer directly in `useBuilderV2Model.ts`.
- [ ] Transfer dialog logic remains in `useBuilderV2Model.ts`.
- [ ] Public `BuilderV2Model` shape is unchanged.
- [ ] Existing Builder V2 page and model tests pass.
- [ ] Typecheck, lint, format check, and diff whitespace checks pass.

## STOP Conditions

Stop and report if:

- The extraction requires changing import/export formats.
- The public `BuilderV2Model` shape must change.
- The adapter pulls in transfer dialog or loadout command behavior.
- A verification command fails twice after reasonable fix attempts.
