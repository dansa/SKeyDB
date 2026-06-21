# Plan 006: Narrow The Builder V2 DnD Command Port

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/features/builder-v2/useBuilderV2Dnd.ts src/features/builder-v2/BuilderV2ModelTypes.ts src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/builder-v2-dnd.ts src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

Builder V2 DnD has a good pure descriptor/action layer, but the hook still
accepts the entire `BuilderV2Model`. That couples drag behavior to unrelated
page state, picker state, dialogs, import/export, and quick-lineup commands.
Introducing a narrow DnD command port keeps future DnD changes from depending
on the whole model shape and prepares the larger model split in plan 008.

## Current State

Relevant files:

- `src/features/builder-v2/useBuilderV2Dnd.ts` - DnD lifecycle and dispatch.
- `src/features/builder-v2/BuilderV2ModelTypes.ts` - wide model interface.
- `src/features/builder-v2/BuilderV2Page.tsx` - creates `model` and passes it
  into `useBuilderV2Dnd`.
- `src/features/builder-v2/builder-v2-dnd.ts` - pure payload/action contract.
- `src/features/builder-v2/builder-v2-dnd.test.ts` - DnD contract tests.

Current excerpts:

```ts
// src/features/builder-v2/useBuilderV2Dnd.ts:27
import type {BuilderV2Model} from './BuilderV2ModelTypes'

// src/features/builder-v2/useBuilderV2Dnd.ts:42
export function useBuilderV2Dnd({model}: UseBuilderV2DndOptions) {
```

```ts
// src/features/builder-v2/useBuilderV2Dnd.ts:153
function dispatchBuilderV2DndAction(model: BuilderV2Model, action: BuilderV2DndAction) {
  switch (action.kind) {
    case 'assign-awakener':
      model.assignAwakenerToSlot(action.awakenerId, action.slotId)
```

```ts
// src/features/builder-v2/BuilderV2ModelTypes.ts:253
export interface BuilderV2Model {
  activeTeamId: string
  activeTeamName: string
  ...
  moveTeamToIndex: (teamId: string, nextIndex: number) => void
  swapTeamSlots: (...)
```

```tsx
// src/features/builder-v2/BuilderV2Page.tsx:83
const dnd = useBuilderV2Dnd({model})
```

Repo conventions:

- Keep pure DnD routing in `builder-v2-dnd.ts`.
- Keep mutation and transfer behavior in the model/command layer.
- Preserve click assignment fallback; pointer DnD is progressive enhancement.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| DnD tests | `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/useBuilderV2Dnd.ts`
- `src/features/builder-v2/BuilderV2ModelTypes.ts`
- `src/features/builder-v2/BuilderV2Page.tsx`
- `src/features/builder-v2/builder-v2-dnd.test.ts`
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Changing DnD behavior.
- Mobile DnD.
- Changing `builder-v2-dnd.ts` action semantics unless type exports need to
  move.
- Splitting `useBuilderV2Model.ts`; that is plan 008.

## Git Workflow

- Branch: `codex/006-builder-v2-dnd-port`.
- Commit message example: `refactor: narrow builder v2 dnd model port`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Define a DnD-specific port type

In `src/features/builder-v2/BuilderV2ModelTypes.ts`, add an exported interface
such as `BuilderV2DndCommandPort`. Include only what `useBuilderV2Dnd.ts` reads
or calls:

- `slots`
- `teams`
- `teamPreviewMode`
- `moveTeamToIndex`
- all methods called by `dispatchBuilderV2DndAction`

Do not include picker state, dialogs, import/export props, search query,
quick-lineup commands, or unrelated UI state.

**Verify**:
`npx tsc -p tsconfig.app.json --noEmit` should still pass after updating the
type but before changing consumers if no unused export errors appear.

### Step 2: Change `useBuilderV2Dnd` to consume the port

In `src/features/builder-v2/useBuilderV2Dnd.ts`, replace `BuilderV2Model` with
`BuilderV2DndCommandPort` in:

- `UseBuilderV2DndOptions`
- `createBuilderV2TeamSortPreview`
- `dispatchBuilderV2TeamSort`
- `dispatchBuilderV2DndAction`

Do not change switch cases or dispatch behavior.

**Verify**:
`npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run` passes.

### Step 3: Build the port in `BuilderV2Page`

In `src/features/builder-v2/BuilderV2Page.tsx`, create a memoized or stable
plain object named `dndCommandPort` with only the port fields. Pass that into
`useBuilderV2Dnd`.

Be careful not to introduce stale callbacks. Existing model methods are already
stable enough for current use; if memoizing the object causes dependency churn,
prefer a simple object construction unless profiling proves otherwise.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

### Step 4: Add a type-level guard test or compile-time check

If practical, add a tiny test or local type assignment proving a full
`BuilderV2Model` is assignable to `BuilderV2DndCommandPort`, but the hook's
signature no longer imports the full model.

At minimum, ensure `useBuilderV2Dnd.ts` no longer imports `BuilderV2Model`.

**Verify**:

```powershell
Select-String -LiteralPath src/features/builder-v2/useBuilderV2Dnd.ts -Pattern 'BuilderV2Model'
```

should return no matches.

## Test Plan

- Existing DnD contract tests should pass unchanged.
- Existing Builder V2 page tests should pass unchanged.
- No new behavioral tests are required unless refactoring exposes a missing
  dispatch case.

## Done Criteria

- [ ] `useBuilderV2Dnd.ts` depends on `BuilderV2DndCommandPort`, not
      `BuilderV2Model`.
- [ ] DnD behavior and tests are unchanged.
- [ ] `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` passes.
- [ ] `npm run lint` passes.

## STOP Conditions

Stop and report if:

- Creating the port requires changing model behavior.
- A DnD action needs state not currently apparent in `useBuilderV2Dnd.ts`.
- The refactor expands into `useBuilderV2Model.ts` ownership splitting.

## Maintenance Notes

Future DnD additions should extend `BuilderV2DndCommandPort` deliberately rather
than passing the full model back into the DnD hook. Reviewers should check that
new drag behavior still routes through `builder-v2-dnd.ts` action resolution.
