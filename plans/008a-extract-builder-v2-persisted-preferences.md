# Plan 008a: Extract Builder V2 Persisted Preferences

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. The reviewer maintains `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: MED
- **Depends on**: `plans/006-narrow-builder-v2-dnd-command-port.md`
- **Category**: tech-debt
- **Planned at**: commit `704d31b1`, 2026-06-18

## Why This Matters

`useBuilderV2Model.ts` still owns a cluster of persisted picker and preview
preferences directly in the main model hook. This is the lowest-risk first
tranche of plan 008: move preference/localStorage ownership behind a local hook
while keeping the public `BuilderV2Model` shape and behavior unchanged.

## Scope

**In scope**:

- `src/features/builder-v2/useBuilderV2Model.ts`
- New local hook/module under `src/features/builder-v2/`, expected name
  `useBuilderV2Preferences.ts`
- Focused tests only if existing coverage is insufficient

**Out of scope**:

- Team-management command extraction.
- Import/export dialog extraction.
- Picker filtering state that is not persisted.
- Route, UI layout, drag/drop behavior, persistence key changes, or format
  changes.

## Steps

### Step 1: Extract persisted preference state

Create `useBuilderV2Preferences.ts` and move these state keys, initializers, and
storage effects out of `useBuilderV2Model.ts`:

- `allowDuplicateAwakenerIdentities`
- `displayUnowned`
- `sinkUnownedToBottom`
- `promoteRecommendedGear`
- `promoteMatchingWheelMainstats`
- `awakenerSortKey`
- `awakenerSortDirection`
- `awakenerSortGroupByRealm`
- `wheelSortKey`
- `wheelSortDirection`
- `teamPreviewMode`

Keep all storage keys and default values unchanged.

### Step 2: Return a stable adapter surface

The hook should return the current values and setters/toggles needed by
`useBuilderV2Model.ts`, including:

- `setAllowDuplicateAwakenerIdentities`
- `setDisplayUnowned`
- `setSinkUnownedToBottom`
- `setPromoteRecommendedGear`
- `setPromoteMatchingWheelMainstats`
- `setAwakenerSortKey`
- `toggleAwakenerSortDirection`
- `setAwakenerSortGroupByRealm`
- `setWheelSortKey`
- `toggleWheelSortDirection`
- `setTeamPreviewMode`

Do not change the exported `BuilderV2Model` shape.

### Step 3: Keep the main model hook as composer

In `useBuilderV2Model.ts`, call the new hook and destructure the same local names
currently used throughout the file. Leave non-persisted picker filters and
team-management commands in place.

## Verification

- `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts --run`
- `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`
- `npm run format:check`
- `git diff --check`

## Done Criteria

- [ ] Persisted preference state/effects are no longer directly owned by
      `useBuilderV2Model.ts`.
- [ ] Storage keys, default values, and public model shape are unchanged.
- [ ] Existing Builder V2 model and page tests pass.
- [ ] Typecheck, lint, format check, and diff whitespace checks pass.

## STOP Conditions

Stop and report if:

- The extraction requires changing shared `builderDraftStore` semantics.
- The public `BuilderV2Model` shape must change.
- Preference extraction expands into team-management or import/export ownership.
- A verification command fails twice after reasonable fix attempts.
