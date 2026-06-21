# Plan 004: Reconcile Builder V2 Beta Promotion Truth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/App.tsx src/App.test.tsx docs/refactor-goals/builder-v2-rebuild/designer-handoff.md docs/roadmap.md docs/backlog.md`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **State**: DONE
- **Priority**: P1
- **Effort**: S-M
- **Risk**: LOW-MED
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

The code now exposes Builder V2 publicly as a beta and lets users make it their
default builder route. Older handoff docs still describe it as hidden,
isolated, and unpromoted. That contradiction makes the next slice ambiguous:
polish a hidden experiment, harden a public beta, or promote the primary
Builder candidate.

## Current State

Relevant files:

- `src/App.tsx` - nav, beta banner, default-route opt-in, and classic escape.
- `src/App.test.tsx` - route/banner tests.
- `docs/refactor-goals/builder-v2-rebuild/designer-handoff.md` - older design
  handoff.
- `docs/roadmap.md` and `docs/backlog.md` - current product planning.

Current excerpts:

```md
// docs/refactor-goals/builder-v2-rebuild/designer-handoff.md:49
- `/builder-v2` remains isolated and unpromoted. `/builder` remains protected.
```

```md
// docs/refactor-goals/builder-v2-rebuild/designer-handoff.md:121
- Navigation promotion from hidden `/builder-v2` to public Builder.
```

```tsx
// src/App.tsx:86
const BUILDER_V2_MOBILE_NAV_ITEM: MobileNavItem = {
  label: 'Builder V2',
  to: '/builder-v2',
```

```tsx
// src/App.tsx:359
builderV2Default && !isClassicBuilderRequest(search) ? (
  <Navigate replace to='/builder-v2' />
) : (
  <BuilderPage />
)
```

```tsx
// src/App.tsx:435
<strong className='text-[var(--ui-accent-gold-soft)]'>Builder V2 is in beta.</strong>
```

Already covered tests:

```tsx
// src/App.test.tsx:453
it('redirects the builder route to Builder V2 after opt-in while preserving a classic escape hatch', async () => {
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| App route tests | `npx vitest run src/App.test.tsx --run` | all tests pass |
| Builder V2 page tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Format check | `npm run format:check` | exit 0 |

## Scope

**In scope**:

- `src/App.tsx` only if copy/nav labels need alignment.
- `src/App.test.tsx` only if copy/nav behavior changes.
- `docs/refactor-goals/builder-v2-rebuild/designer-handoff.md`
- `docs/roadmap.md`
- `docs/backlog.md`

**Out of scope**:

- Replacing `/builder` with V2 as the only route.
- Removing classic Builder.
- Changing persistence keys or migration behavior.
- Changing Builder V2 functionality.

## Git Workflow

- Branch: `codex/004-builder-v2-promotion-truth`.
- Commit message example: `docs: align builder v2 beta posture`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Choose and record one product posture

Pick exactly one posture and make it explicit in docs:

1. Hidden beta - remove public nav/default affordances. This conflicts with
   current code and should only be chosen if the operator explicitly wants it.
2. Public beta - keep nav/default opt-in, keep classic route, align docs/copy.
3. Primary Builder candidate - stronger copy and roadmap language, but still
   preserve classic escape.

Given current code, choose **public beta** unless the operator says otherwise.

**Verify**:
The chosen posture is stated in `designer-handoff.md` or a current docs note.

### Step 2: Update stale handoff language

Edit `docs/refactor-goals/builder-v2-rebuild/designer-handoff.md` so it no
longer says Builder V2 is hidden/unpromoted. Keep the useful behavior
contracts, but mark the handoff as historical where appropriate.

Also adjust the source hierarchy so current `PRODUCT.md` and `DESIGN.md` are
the primary visual canon, while older concept images are reference material.

**Verify**:
Search the handoff for stale phrases:

```powershell
Select-String -LiteralPath docs/refactor-goals/builder-v2-rebuild/designer-handoff.md -Pattern 'hidden','unpromoted','future work'
```

Any matches should be intentionally true in the new posture.

### Step 3: Align app copy only if needed

If the public-beta posture is chosen, `src/App.tsx` may already be acceptable.
Only change copy if it currently implies the wrong stage. Examples:

- Keep "Builder V2 is in beta" if public beta is the chosen truth.
- Keep "Make Builder V2 default" if opt-in remains valid.
- Do not rename the route or remove the classic escape.

If you change copy, update `src/App.test.tsx` selectors accordingly.

**Verify**:
`npx vitest run src/App.test.tsx --run` passes.

### Step 4: Update roadmap/backlog references

In `docs/roadmap.md` and `docs/backlog.md`, ensure Builder work is described as
finishing/hardening the public Builder V2 beta rather than creating or hiding
the beta.

**Verify**:
`npm run format:check` passes.

## Test Plan

- Run `src/App.test.tsx` if app copy or nav changes.
- Run format check for Markdown and JSON formatting.

## Done Criteria

- [x] Current docs state the chosen Builder V2 posture.
- [x] No current doc says `/builder-v2` is hidden/unpromoted unless that is
      deliberately true again.
- [x] App copy/nav/tests align with the chosen posture.
- [x] `npx vitest run src/App.test.tsx --run` passes if app files changed.
- [x] `npm run format:check` passes.

## STOP Conditions

Stop and report if:

- The operator disagrees with the default public-beta posture.
- Aligning docs reveals a real product decision: remove nav, auto-promote V2,
  or deprecate classic Builder.
- Tests require changing route behavior, not just copy expectations.

## Maintenance Notes

This plan is a product truth cleanup. Do not smuggle in visual redesign,
promotion, or deprecation work. Future Builder plans should cite this posture
when deciding whether to optimize for beta safety or primary-route polish.
