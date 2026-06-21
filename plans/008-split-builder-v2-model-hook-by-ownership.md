# Plan 008: Split The Builder V2 Model Hook By Ownership

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/features/builder-v2/useBuilderV2Model.ts src/features/builder-v2/BuilderV2ModelTypes.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-picker-options.ts src/features/builder-v2/builder-v2-loadout-commands.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/006-narrow-builder-v2-dnd-command-port.md`
- **Category**: tech-debt
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

`useBuilderV2Model.ts` remains the main integration hub for Builder V2. It owns
hydration, autosave, persisted preferences, picker state, active team
projections, quick-lineup, team management, transfers, import/export, and
command dispatch. That made sense while bootstrapping V2, but now future UX work
has to touch one very large hook and one very wide model interface. This plan
splits ownership incrementally while keeping the exported model shape stable.

## Current State

Relevant files:

- `src/features/builder-v2/useBuilderV2Model.ts` - 2,497-line composer/hook.
- `src/features/builder-v2/BuilderV2ModelTypes.ts` - exported `BuilderV2Model`.
- `src/features/builder-v2/useBuilderV2Model.test.ts` - model behavior tests.
- `src/features/builder-v2/builder-v2-picker-options.ts` - already extracted
  picker option pure queries.
- `src/features/builder-v2/builder-v2-loadout-commands.ts` - already extracted
  loadout command resolvers.

Current excerpts:

```ts
// src/features/builder-v2/useBuilderV2Model.ts:154
export function useBuilderV2Model({
  showToast = () => undefined,
}: UseBuilderV2ModelOptions = {}): BuilderV2Model {
```

```ts
// src/features/builder-v2/useBuilderV2Model.ts:201
const [canAutosaveBuilderDraft] = useState(() => {
  const persisted = loadBuilderDraft(storage)
  ...
  builderDraftStore.getState().hydrateBuilderDraft(initialBuilderState)
```

```ts
// src/features/builder-v2/useBuilderV2Model.ts:903
const setActiveTeam = useCallback(
  (teamId: string) => {
    if (quickLineupState) {
```

```ts
// src/features/builder-v2/useBuilderV2Model.ts:1647
const applyResolvedLoadoutCommand = useCallback(
  (command: BuilderV2ResolvedLoadoutCommand) => {
```

```ts
// src/features/builder-v2/useBuilderV2Model.ts:2085
const {
  openImportDialog,
  openExportAllDialog,
  ...
} = useBuilderImportExport({
```

```ts
// src/features/builder-v2/BuilderV2ModelTypes.ts:253
export interface BuilderV2Model {
  activeTeamId: string
  ...
  importExportDialogProps: BuilderImportExportDialogsProps
  transferDialog: BuilderV2TransferDialog | null
```

Repo conventions:

- Prefer focused helper modules already present in `builder-v2-*`.
- Keep behavior-preserving refactors characterized by existing tests.
- Do not change `/builder` behavior or shared persistence keys.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Model tests | `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts --run` | all tests pass |
| Page tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/useBuilderV2Model.ts`
- `src/features/builder-v2/BuilderV2ModelTypes.ts`
- New local modules under `src/features/builder-v2/`
- `src/features/builder-v2/useBuilderV2Model.test.ts`
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Rewriting the builder store.
- Changing persistence keys, migration behavior, import/export formats, or
  classic Builder behavior.
- Visual redesign.
- DnD behavior changes beyond adapting to the port from plan 006.

## Git Workflow

- Branch: `codex/008-builder-v2-model-split`.
- Commit message example: `refactor: split builder v2 model ownership`.
- Prefer multiple local commits if the operator asked for commits; otherwise
  keep the diff reviewable by tranche.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Confirm plan 006 landed or adapt safely

Check whether `useBuilderV2Dnd.ts` consumes a narrow DnD port. If it still
consumes `BuilderV2Model`, stop and either execute plan 006 first or report that
this plan's prerequisite is missing.

**Verify**:

```powershell
Select-String -LiteralPath src/features/builder-v2/useBuilderV2Dnd.ts -Pattern 'BuilderV2Model'
```

should return no matches.

### Step 2: Extract persisted picker/preference state

Create a local hook/module such as `useBuilderV2Preferences.ts`. Move these
state keys and storage effects out of `useBuilderV2Model.ts`:

- duplicate awakeners preference
- display unowned
- sink unowned
- recommendation toggles
- awakener sort key/direction/grouping
- wheel sort key/direction
- team preview mode

Return the same values and setter callbacks currently assembled into the model.
Keep localStorage keys unchanged.

**Verify**:
`npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts --run` passes.

### Step 3: Extract team-management command adapter

Create a module/hook such as `useBuilderV2TeamManagementCommands.ts`. Move team
add/select/rename/delete/reset/template/reorder logic out of the main hook.
Keep the public `BuilderV2Model` methods unchanged at the end of this step.

This extraction must preserve transient cleanup behavior:

- quick-lineup cancellation on team switch
- transfer clearing
- pending team action clearing
- rename cancellation
- violation clearing
- editing target clearing

**Verify**:
`npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2TeamManagement.test.tsx --run` passes.

### Step 4: Extract import/export and dialog adapter

Move `useBuilderImportExport` wiring and transfer/team-action dialog assembly
into a local adapter module if it can be done without changing behavior. If this
step becomes larger than the previous two combined, STOP and split it into a
separate plan rather than forcing it through.

**Verify**:
`npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

### Step 5: Keep `useBuilderV2Model` as a composer

After extractions, `useBuilderV2Model` should mostly compose smaller hooks and
return the existing model shape. Do not force a perfect split. Leave loadout
command application in place if moving it would increase risk.

**Verify**:
`npx tsc -p tsconfig.app.json --noEmit` and `npm run lint` pass.

## Test Plan

- Existing `useBuilderV2Model.test.ts` is the primary characterization suite.
- Existing `BuilderV2Page.test.tsx` protects page flows.
- Add focused model tests only where extraction exposes an untested behavior,
  especially transient cleanup or dialog flow.

## Done Criteria

- [ ] Preference/storage state is no longer directly owned by the main model
      hook body.
- [ ] Team-management commands are behind a local adapter/hook.
- [ ] `BuilderV2Model` external shape remains compatible for current consumers.
- [ ] No persistence key, import/export format, or classic Builder behavior
      changes.
- [ ] `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` and `npm run lint` pass.

## STOP Conditions

Stop and report if:

- The extraction requires changing shared `builderDraftStore` semantics.
- The public `BuilderV2Model` shape must change in a way that touches many
  component files.
- Import/export dialog extraction becomes its own large refactor.
- A verification command fails twice after reasonable fix attempts.

## Maintenance Notes

This plan is about ownership boundaries, not line-count vanity. Reviewers should
look for smaller reasons-to-change and unchanged behavior, not just fewer lines
in `useBuilderV2Model.ts`.
