# Quality-First Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the final quality of `pr14-salvage` by combining a broader SonarJS/static-analysis target with ownership-aware refactors that materially improve architecture, readability, and maintainability beyond the minimum needed to "adopt" new lint rules.

**Architecture:** Treat PR #14 as evidence of where code-health work was valuable, but optimize for the strongest current architecture rather than PR parity. Set the desired lint target early, inventory the fallout, then execute fixes by ownership waves: domain foundations first, builder orchestration next, collection state/view-model next, and UI/page-shell cleanup last. Each wave should prefer root-cause refactors over rule-shaped local patches, with domain logic staying in `src/domain/*`, orchestration in `src/pages/*`, and reusable interaction/UI behavior in shared helpers/components.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 4, ESLint 10 flat config, eslint-plugin-sonarjs 4.x, Prettier 3, Tailwind CSS 4.

---

**Last updated:** 2026-03-07T22:37

**Related docs:**
- Notes: `docs/notes/2026-03-06-pr14-single-commit-audit.md`
- Prior plan: `docs/archive/plans/2026-03-06-pr14-salvage-plan.md`
- Roadmap item: `docs/roadmap.md`
- Backlog source: `docs/backlog.md`

**Status:** Done

## Scope

- Raise the branch from the current curated SonarJS subset to SonarJS `recommended` or as close as ESLint 10 compatibility allows.
- Keep a small set of repo-valuable extra rules if they remain high-signal after the broader cleanup.
- Use the SonarJS fallout map to drive broad, ownership-aware refactors in the most important code paths.
- Refactor for stronger code shape where it materially improves the end product, even when the change goes beyond silencing a lint warning.
- Revisit the most valuable audit-note hotspots and refactor them toward the best current architecture rather than PR14 similarity.
- Preserve all intentional current-branch strictness and capability improvements identified during the PR14 audit.

## Out of Scope

- Blindly preserving PR14 structure where the current branch has a stronger shape.
- Rule churn for low-value or noisy static-analysis checks.
- Large speculative redesigns that are not justified by code-health, maintainability, or correctness gains.
- Reopening the already-closed broad PR14 audit unless fresh evidence appears.
- Mechanical formatting-only sweeps that do not improve maintainability or correctness.

## Risks / Watchpoints

- A broad SonarJS ratchet can create "lint-shaped" edits that obscure better architectural solutions if we fix issues in raw output order.
- Builder and collection layers are easy to over-refactor unless ownership boundaries remain strict.
- Domain helpers such as codecs, persistence contracts, comparators, and normalization logic are high-risk because they encode deterministic behavior.
- A cleanup pass that mixes runtime changes, UI reshaping, and test churn without wave boundaries will become hard to verify and review.
- Some PR14-touched files are behavior-equivalent today; refactoring them should be justified by current architecture and rule pressure, not by historical attachment.

## Progress Snapshot

- Done:
  - Finished the full PR14 squashed-commit audit.
  - Settled on the current repo-owned high-signal static-analysis baseline after the cleanup work instead of forcing every candidate SonarJS rule.
  - Completed the ownership-aware cleanup waves across domain, builder, collection, shared UI, database/detail, and focused tests.
  - **Reverted Codex's artificial BuilderPage extractions** (`BuilderPageLayout.tsx`, `BuilderPageOverlayLayer.tsx`, `useBuilderPagePresentation.ts`) — these were mechanical prop-threading that increased complexity. See "Lessons Learned" below.
  - **Completed genuine BuilderPage refactoring** (954 → 655 lines, max function complexity 5):
    - Created 5 purpose-built hooks: `useBuilderResetUndo`, `usePreviewSlotDrag`, `useBuilderDndWrappers`, `useBuilderPosseActions`, `useSelectionDismiss`
    - Extracted 2 components: `BuilderDragOverlay`, `BuilderToolbar`
    - Bundled import/export dialog props, simplified forwarding closures, created stable shared callbacks
    - Removed the per-file cognitive complexity override — no longer needed
  - Cleared the branch-wide strict/static-analysis backlog and verified the result with `npm run lint` and `npm run verify`.
  - Added an isolated optional React sidecar lint check so high-value React rules can be sampled without changing the main repo gate.
- Next:
  - Archive this plan now that the branch cleanup pass is shipped.
- Blockers:
  - None

## Verification

- `npm run lint`
- `npm run test:quick`
- `npm run build`
- `npm run verify`

### Task 1: Define the target static-analysis baseline

**Files:**
- Modify: `eslint.config.js`
- Test: verification commands only (`npm run lint`)

**Measured baseline target (2026-03-06):**

- Adopt `sonarjs.configs.recommended` for `src/**/*.{ts,tsx}`.
- Retain repo-owned `unused-imports/no-unused-imports` and `unused-imports/no-unused-vars` enforcement.
- Disable low-signal or overlapping SonarJS rules that would create stylistic or duplicate-rule churn in this repo: `sonarjs/comment-regex`, `sonarjs/file-header`, `sonarjs/fixme-tag`, `sonarjs/no-commented-code`, `sonarjs/no-unused-function-argument`, `sonarjs/no-unused-vars`, `sonarjs/prefer-read-only-props`, `sonarjs/todo-tag`, `sonarjs/unused-import`, and `sonarjs/use-type-alias`.
- Initial fallout after the ratchet: `81` errors across `12` rules. Top rule clusters: `sonarjs/no-nested-conditional` (`30`), `sonarjs/cognitive-complexity` (`25`), `sonarjs/different-types-comparison` (`6`), `sonarjs/slow-regex` (`5`), and `sonarjs/prefer-regexp-exec` (`4`).
- Highest-concentration files from the first run: `src/pages/builder/BuilderSelectionPanel.tsx` (`8`), `src/pages/collection/useCollectionViewModel.ts` (`6`), `src/pages/CollectionPage.tsx` (`6`), `src/domain/import-export.ts` (`5`), and `src/pages/collection/OwnedAssetBoxExport.tsx` (`5`).
- Because the repo pre-commit hook runs `npm run verify`, the standalone Task 1 commit cannot land while the branch intentionally fails lint; fold that commit into the first cleanup wave unless the commit strategy is changed deliberately.

**Step 1: Write the failing test**

Use the lint config change itself as the failing proof by expanding the SonarJS rule set toward `recommended` plus the explicitly retained extra rules.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: new SonarJS/static-analysis violations appear across the repo.

**Step 3: Write minimal implementation**

Update `eslint.config.js` to adopt the broader SonarJS baseline and keep only the extra rules that are still expected to add signal for this repo.

**Step 4: Run tests to verify it passes**

Run: `npm run lint`
Expected: PASS only after the subsequent cleanup waves land.

**Step 5: Commit**

```bash
git add eslint.config.js
git commit -m "chore: raise static analysis baseline"
```

### Task 2: Domain foundations and contracts cleanup wave

**Files:**
- Modify: `src/domain/import-export.ts`
- Modify: `src/domain/ingame-codec.ts`
- Modify: `src/domain/collection-ownership.ts`
- Modify: `src/domain/collection-sorting.ts`
- Modify: `src/domain/team-rules.ts`
- Modify: `src/domain/mainstats.ts`
- Modify: `src/domain/wheel-mainstat-filters.ts`
- Modify: related domain tests in `src/domain/*.test.ts`
- Test: owning domain tests plus `npm run lint`

**Step 1: Write the failing test**

Pick the first domain rule/call-site cluster where the broader SonarJS baseline or current code shape indicates duplication, overly complex branching, unclear invariants, or codec/persistence risk. Add or update the nearest domain regression tests when behavior changes are involved.

**Step 2: Run test to verify it fails**

Run: targeted `vitest` commands for the touched domain files, then `npm run lint`
Expected: current code shape fails the stricter lint target and/or the targeted regression highlights the needed cleanup.

**Step 3: Write minimal implementation**

Refactor domain logic at the owning layer by simplifying branching, extracting reusable comparators/normalizers, tightening invariants, and clarifying deterministic behavior without pushing domain rules into UI or page code.

**Step 4: Run tests to verify it passes**

Run: targeted domain tests, `npm run lint`, and `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/domain
git commit -m "refactor: strengthen domain foundations"
```

### Task 3: Builder orchestration and state cleanup wave

**Files:**
- Modify: `src/pages/BuilderPage.tsx`
- Modify: `src/pages/builder/useBuilderViewModel.ts`
- Modify: `src/pages/builder/useBuilderImportExport.ts`
- Modify: `src/pages/builder/team-state.ts`
- Modify: `src/pages/builder/import-planner.ts`
- Modify: `src/pages/builder/transfer-resolution.ts`
- Modify: selected `src/pages/builder/*.tsx` orchestration components
- Modify: related tests in `src/pages/**/*.test.tsx` and `src/pages/builder/*.test.ts`
- Test: builder-focused tests plus `npm run lint`

**Step 1: Write the failing test**

Choose the highest-value builder cluster where SonarJS and code-health concerns overlap, especially long orchestration functions, duplicated decision trees, or unclear state transitions. Add or update regression coverage before changing behavior.

**Step 2: Run test to verify it fails**

Run: targeted builder test commands and `npm run lint`
Expected: failing lint and/or targeted test evidence for the current shape.

**Step 3: Write minimal implementation**

Refactor builder logic to reduce orchestration sprawl, move reusable decision logic into the proper helper/domain layer, and improve state readability without weakening current-branch safety checks.

**Step 4: Run tests to verify it passes**

Run: targeted builder tests, `npm run lint`, and `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/BuilderPage.tsx src/pages/builder
git commit -m "refactor: simplify builder orchestration"
```

### Task 4: Collection state and export cleanup wave

**Files:**
- Modify: `src/pages/CollectionPage.tsx`
- Modify: `src/pages/collection/useCollectionViewModel.ts`
- Modify: `src/pages/collection/useOwnedAwakenerBoxEntries.ts`
- Modify: `src/pages/collection/useOwnedWheelBoxEntries.ts`
- Modify: `src/pages/collection/OwnedAssetBoxExport.tsx`
- Modify: `src/pages/collection/OwnedAwakenerBoxExport.tsx`
- Modify: `src/pages/collection/OwnedWheelBoxExport.tsx`
- Modify: related collection tests
- Test: collection-focused tests plus `npm run lint`

**Step 1: Write the failing test**

Target the highest-value collection cluster where the broader lint baseline and current architecture both suggest simplification, especially view-model complexity, repeated export-entry shaping, or sort/ownership coordination.

**Step 2: Run test to verify it fails**

Run: targeted collection tests and `npm run lint`
Expected: failing lint and/or tests that capture the cleanup objective.

**Step 3: Write minimal implementation**

Refactor collection state and export shaping to reduce duplication, clarify sorting/ownership flows, and preserve the current branch's stronger collection behavior.

**Step 4: Run tests to verify it passes**

Run: targeted collection tests, `npm run lint`, and `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/CollectionPage.tsx src/pages/collection
git commit -m "refactor: streamline collection state and export flows"
```

### Task 5: UI/page-shell and residual cleanup wave

**Files:**
- Modify: selected `src/components/ui/*`
- Modify: selected `src/pages/*`
- Modify: related tests
- Test: `npm run lint`, `npm run test:quick`, `npm run verify`

**Step 1: Write the failing test**

Use the residual lint output and the remaining hotspot list to select UI/page-shell files where the cleanup is still high-value after the domain/builder/collection waves are complete.

**Step 2: Run test to verify it fails**

Run: `npm run lint` and targeted tests for the selected files
Expected: residual issues remain after the earlier waves.

**Step 3: Write minimal implementation**

Clean up remaining duplicated helpers, awkward prop shaping, and page-shell orchestration only where the resulting code is clearer and more reusable, not merely to eliminate every last aesthetic smell.

**Step 4: Run tests to verify it passes**

Run: `npm run lint`, `npm run test:quick`, and `npm run verify`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui src/pages
git commit -m "refactor: finish quality cleanup pass"
```

## Heuristics for high-value refactoring during this pass

- Prefer refactors that remove duplicated branching, duplicated shaping, or repeated orchestration steps across multiple files.
- Prefer extracting meaningful helpers only when the helper clarifies ownership and reduces repetition; do not create abstraction for its own sake.
- Prefer simplifying long view-model/orchestration functions by isolating state transitions or domain-derived transforms.
- Preserve current-branch strictness checks, decode validation, bounds checks, and data-contract enforcement unless a stronger replacement is introduced.
- When SonarJS suggests a cleanup that conflicts with a clearer repo-owned design, favor the clearer design and tune the rule set only if necessary.

## Lessons Learned: BuilderPage Refactoring

Codex's initial attempt at BuilderPage produced **artificial extractions** that made the file worse:

- `BuilderPageLayout.tsx` — a shell component that received 40+ props and rendered them without owning any state.
- `BuilderPageOverlayLayer.tsx` — a thin wrapper around DragOverlay that also just threaded props.
- `useBuilderPagePresentation.ts` — a "hook" that bundled unrelated derived values without owning any state or effects.

**Why these failed:** They satisfied the sonarjs cognitive-complexity rule by moving code out of the function, but the complexity didn't decrease — it just spread across more files. Every prop threaded through is a maintenance burden. A component that owns no state and just passes props is not a useful abstraction.

**What worked instead:** Hooks and components that **own their state and effects**:
- `useBuilderResetUndo` owns the pending-reset flag, undo snapshot, and timeout cleanup.
- `usePreviewSlotDrag` owns the dragged team/slot state and derived values.
- `BuilderDragOverlay` owns the derived owned-level lookups that only it needs.
- `BuilderToolbar` is a self-contained visual zone with a clean boolean/callback interface.

## Rules for Codex / AI Agent Refactoring

These rules supplement `AGENTS.md` with specific guidance for automated refactoring tasks.

### Component extraction rules

1. **A new component must own something.** It should manage its own state, derive its own values, or encapsulate a visually/semantically distinct zone. A component that only receives props and renders them is not an extraction — it's indirection.
2. **Count the props.** If a new component needs 15+ props to function, the extraction boundary is probably wrong. Good boundaries have narrow interfaces (5-10 props for complex components, fewer for simple ones).
3. **The "delete test":** If you could delete the extracted component and inline its JSX back into the parent with zero logic changes, the extraction had no value.

### Hook extraction rules

1. **A hook must own state, effects, or refs.** A hook that only computes derived values from its arguments is a plain function, not a hook. Call it a function.
2. **Group by lifecycle, not by lint pressure.** Extract a hook because related state and effects belong together, not because a function is "too long." The hook should make sense if you read only its file.
3. **Don't create barrel hooks.** A hook that takes 20 arguments and returns 20 values is just moving code around. The arguments should be cohesive — if they aren't, the hook is doing too many things.

### Lint rule satisfaction

1. **Never mechanically satisfy a lint rule.** If the rule says "reduce cognitive complexity," the fix is to simplify the logic — not to move it to another file where the linter can't see it.
2. **Challenge the threshold before creating artificial code.** If a page-level orchestrator genuinely needs complex wiring, it's better to raise the threshold with a comment than to create artificial extraction.
3. **After refactoring, re-measure.** If the score didn't drop meaningfully at the original threshold, the refactoring didn't help.

### General refactoring rules

1. **Simplify forwarding closures.** `(a, b) => { fn(a, b) }` → `fn`. This is noise, not safety.
2. **Bundle prop groups.** When a hook returns 15 values and 12 of them pass straight to a single child component, return a `childProps` bundle and spread it.
3. **Make callbacks optional when the default is a noop.** `onComplete: () => {}` in every call site is a sign the API should use `onComplete?: () => void`.
4. **Create stable callbacks.** If 3 hooks receive `() => setFoo(null)`, create one `const clearFoo = () => setFoo(null)` and share it.
5. **Preserve test coverage.** Never introduce a change that breaks an existing test without understanding why. If a test breaks, fix the root cause — don't delete the test.
6. **Run verification after each wave.** `tsc --noEmit`, `eslint` on touched files, and the nearest test suite. Do not batch verification to the end.

## Archive Trigger

Move this file to `docs/archive/plans/` when the cleanup work is shipped, abandoned, or superseded.
