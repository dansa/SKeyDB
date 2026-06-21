# Plan 002: Put Builder V2 In The Integration Gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- package.json package-lock.json src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

`npm run verify` currently catches Builder V2 because it runs the bounded full
Vitest suite. The named `test:integration` script, however, is still legacy
Builder-only even though Builder V2 is exposed as a beta and can become the
default builder route. Developers using that faster gate can get a false sense
of coverage for the active beta surface.

## Current State

Relevant files:

- `package.json` - npm scripts.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - V2 page and interaction
  tests.
- `src/features/builder-v2/builder-v2-dnd.test.ts` - pure DnD payload, target,
  and routing tests.
- `src/features/builder-v2/useBuilderV2Model.test.ts` - V2 model command tests.

Current excerpts:

```json
// package.json:21
"test": "vitest run",
"test:bounded": "vitest run --run --pool=forks --maxWorkers=4",
"test:scripts": "node --test scripts/*.test.mjs",
"test:unit": "vitest run --run --exclude src/features/builder/BuilderPage*.test.tsx",
"test:integration": "vitest run --run src/features/builder/BuilderPage.awakener-basics.test.tsx ... src/features/builder/BuilderPage.wheels.test.tsx",
```

Builder V2 already has integration-like coverage:

```tsx
// src/features/builder-v2/BuilderV2Page.test.tsx:739
it('imports a single t1 code into an empty active V2 team', () => {

// src/features/builder-v2/BuilderV2Page.test.tsx:864
render(<BuilderV2Page />)
fireEvent.click(screen.getByRole('button', {name: /export active/i}))
```

Repo convention:

- Scripts are npm scripts in `package.json`.
- Do not run dependency-mutating commands for this plan. No dependency changes
  are needed.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Existing integration gate | `npm run test:integration` | all tests pass |
| Focused V2 gate | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts --run` | all tests pass |
| Full bounded suite | `npm run test:bounded` | all tests pass |

## Scope

**In scope**:

- `package.json`
- `package-lock.json` only if npm updates script metadata automatically, which
  should not normally happen

**Out of scope**:

- Moving, renaming, or rewriting test files.
- Adding dependencies.
- Changing Builder behavior.

## Git Workflow

- Branch: `codex/002-builder-v2-integration-gate`.
- Commit message example: `test: include builder v2 in integration gate`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Split the integration scripts clearly

In `package.json`, replace the single long `test:integration` command with
named sub-scripts:

- `test:integration:builder`: the existing legacy BuilderPage files.
- `test:integration:builder-v2`: Builder V2 focused integration-like tests.
- `test:integration`: runs both commands in sequence.

The V2 script should include at least:

- `src/features/builder-v2/BuilderV2Page.test.tsx`
- `src/features/builder-v2/useBuilderV2Model.test.ts`
- `src/features/builder-v2/builder-v2-dnd.test.ts`

Keep command strings explicit like the existing script. Do not introduce a new
test runner or shell dependency.

**Verify**:
`npm run test:integration:builder-v2` should pass.

### Step 2: Run the combined integration gate

Run the renamed legacy gate and the combined gate.

**Verify**:

- `npm run test:integration:builder` passes.
- `npm run test:integration` passes.

### Step 3: Check no lockfile churn occurred

Run `git status --short`. If `package-lock.json` changed, inspect why. Script
changes in `package.json` should not require lockfile changes.

**Verify**:
Only `package.json` and `plans/README.md` should be modified unless there is a
clear, explainable npm metadata reason.

## Test Plan

No new tests are required. This plan changes which existing tests are grouped
under integration scripts.

## Done Criteria

- [ ] `package.json` has `test:integration:builder`,
      `test:integration:builder-v2`, and a combined `test:integration`.
- [ ] `npm run test:integration:builder-v2` passes.
- [ ] `npm run test:integration` passes.
- [ ] `npm run test:bounded` passes or is intentionally skipped with a clear
      reason from the operator.
- [ ] No source files are modified.

## STOP Conditions

Stop and report if:

- The V2 suite is too slow or flaky for the named integration gate.
- Test grouping requires changing test implementations.
- A package manager command attempts to mutate dependencies.

## Maintenance Notes

Whenever Builder V2 gains a new high-risk workflow test, decide whether it
belongs in `test:integration:builder-v2` or only in `test:bounded`. Keep the
script name honest: it should represent both active builder surfaces.
