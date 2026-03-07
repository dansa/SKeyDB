# Strict ESLint Adoption Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adopt the stricter TypeScript ESLint baseline by fixing the surfaced violations instead of weakening the rules.

**Architecture:** Keep `eslint.config.js` on the strict and stylistic type-checked presets, then clean violations in ownership-based slices so each batch stays reviewable. Prioritize the dense `src/pages/database/*` cluster first because it contains repeated patterns such as shorthand void callbacks, unnecessary conditionals, and non-null assertions that can be corrected mechanically without changing behavior.

**Tech Stack:** ESLint 10, typescript-eslint, React 19, TypeScript 5, Vite, Vitest

---

**Status:** Done

**Last updated:** 2026-03-07T22:37

**Related docs:**
- Notes: None
- Roadmap item: None
- Backlog source: None

## Scope

- Fix strict/stylistic ESLint violations surfaced by the current `eslint.config.js` presets.
- Work in small batches, starting with `src/pages/database/*` and nearby helpers/tests.
- Preserve behavior while making lint-driven refactors.

## Out of Scope

- Reworking rule selection to avoid current violations.
- Unrelated feature or UI refactors outside the touched lint slices.

## Risks / Watchpoints

- Several fixes touch interaction-heavy database popover components; preserve click/close behavior.
- Avoid changing type semantics while removing non-null assertions and unnecessary conditionals.
- Prefer minimal code-shape edits that satisfy the rule without hiding real logic.

## Progress Snapshot

- Done:
  - Enabled strict/stylistic type-checked ESLint presets and fixed `tsconfigRootDir` ambiguity.
  - Cleared the repo-wide strict/stylistic TypeScript ESLint backlog in ownership-based batches across database, domain, builder, collection, shared UI, and focused tests.
  - Verified the finished adoption pass with targeted `npx eslint` runs, `npm run lint`, and `npm run verify`.
  - Committed the shipped cleanup as `c8feb90` (`Make repo strict ESLint compliant`).
- Next:
  - Archive this plan now that the strict ESLint adoption work is shipped.
- Blockers:
  - None

## Verification

- `npm run lint`
- Targeted `npx eslint` runs on touched files during each batch
- `npm run verify`

### Task 1: Database interaction and popover callbacks

**Files:**
- Modify: `src/pages/database/DatabaseFilters.tsx`
- Modify: `src/pages/database/RichSegmentRenderer.tsx`
- Modify: `src/pages/database/SkillPopover.tsx`
- Modify: `src/pages/database/TagPopover.tsx`
- Modify: `src/pages/database/PopoverTrailPanel.tsx`
- Modify: `src/pages/database/useDatabaseViewModel.ts`

**Step 1: Write the failing test**

Use the existing ESLint output as the failing signal for `no-confusing-void-expression` and `restrict-template-expressions` in this slice.

**Step 2: Run test to verify it fails**

Run: `npx eslint src/pages/database/DatabaseFilters.tsx src/pages/database/RichSegmentRenderer.tsx src/pages/database/SkillPopover.tsx src/pages/database/TagPopover.tsx src/pages/database/PopoverTrailPanel.tsx src/pages/database/useDatabaseViewModel.ts`
Expected: FAIL with the strict TypeScript ESLint violations already reported.

**Step 3: Write minimal implementation**

Replace shorthand void callbacks with block bodies, make template literal conversions explicit where required, and preserve interaction semantics.

**Step 4: Run tests to verify it passes**

Run: `npx eslint src/pages/database/DatabaseFilters.tsx src/pages/database/RichSegmentRenderer.tsx src/pages/database/SkillPopover.tsx src/pages/database/TagPopover.tsx src/pages/database/PopoverTrailPanel.tsx src/pages/database/useDatabaseViewModel.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/plans/2026-03-07-strict-eslint-adoption.md src/pages/database/DatabaseFilters.tsx src/pages/database/RichSegmentRenderer.tsx src/pages/database/SkillPopover.tsx src/pages/database/TagPopover.tsx src/pages/database/PopoverTrailPanel.tsx src/pages/database/useDatabaseViewModel.ts
git commit -m "chore: fix first strict eslint database batch"
```

### Task 2: Database conditionals and non-null assertions

**Files:**
- Modify: `src/pages/database/AwakenerDetailSidebar.tsx`
- Modify: `src/pages/database/AwakenerGridCard.tsx`
- Modify: `src/pages/database/RichDescription.tsx`

**Step 1: Write the failing test**

Use the existing ESLint output as the failing signal for `no-unnecessary-condition` and `no-non-null-assertion` in this slice.

**Step 2: Run test to verify it fails**

Run: `npx eslint src/pages/database/AwakenerDetailSidebar.tsx src/pages/database/AwakenerGridCard.tsx src/pages/database/RichDescription.tsx`
Expected: FAIL with the reported strict TypeScript ESLint violations.

**Step 3: Write minimal implementation**

Tighten conditionals to reflect actual nullable values, remove unnecessary guards, and replace non-null assertions with code that proves presence structurally.

**Step 4: Run tests to verify it passes**

Run: `npx eslint src/pages/database/AwakenerDetailSidebar.tsx src/pages/database/AwakenerGridCard.tsx src/pages/database/RichDescription.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/database/AwakenerDetailSidebar.tsx src/pages/database/AwakenerGridCard.tsx src/pages/database/RichDescription.tsx
git commit -m "chore: fix strict database type lint conditionals"
```

### Task 3: Remaining domain and test cleanup

**Files:**
- Modify: `src/domain/...`
- Modify: `src/pages/...*.test.tsx`

**Step 1: Write the failing test**

Use the remaining ESLint output after Tasks 1 and 2 as the failing signal.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: FAIL only on the remaining non-database files.

**Step 3: Write minimal implementation**

Fix the remaining strict/stylistic violations in the smallest ownership-based batches.

**Step 4: Run tests to verify it passes**

Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add [remaining touched files]
git commit -m "chore: finish strict eslint adoption cleanup"
```

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
