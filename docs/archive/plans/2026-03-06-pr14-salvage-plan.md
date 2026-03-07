# PR #14 Salvage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Salvage the valuable code-health and structural improvements from PR #14 onto `pr14-salvage` without reintroducing ESLint 9, broad formatter churn, or incomplete alias wiring.

**Architecture:** Keep the salvage work layered and low-churn. First stabilize the tooling foundation on the current branch with ESLint 10-compatible plugins and a scoped Prettier setup, then wire a single `@/*` alias end-to-end, and only then port semantic changes from `pr14-reference` in thin slices. Use `pr14-reference` as the local source of truth for PR content and `pr14-salvage` as the branch that receives the curated changes.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 4, ESLint 10 flat config, Prettier 3, Tailwind CSS 4.

---

**Status:** Done

**Last updated:** 2026-03-07T22:37

**Related docs:**
- Notes: `docs/notes/2026-03-06-pr14-single-commit-audit.md`
- Roadmap item: `docs/roadmap.md`
- Backlog source: `docs/backlog.md`

## Scope

- Keep `pr14-reference` as a local mirror of PR #14 for local diffing and salvage.
- Adopt an ESLint 10-compatible code-health baseline in `package.json` and `eslint.config.js`.
- Add a scoped Prettier setup for code/config files while excluding Markdown and JSON reflow.
- Wire a single `@/*` alias across TypeScript and Vite.
- Decide whether import rewrites should be repo-wide or limited to touched files after the alias infrastructure is stable.
- Port semantic improvements from `pr14-reference` into `src/domain/*`, `src/pages/builder/*`, `src/pages/collection/*`, and related UI files in thin slices.

## Out of Scope

- Merging PR #14 as-is.
- Downgrading ESLint from 10.x.
- Adopting `eslint-plugin-import-x`, `eslint-plugin-react`, or `eslint-plugin-no-relative-import-paths` before they support ESLint 10.
- Reflowing Markdown or formatting JSON/data files as part of Prettier adoption.
- Pulling PR changes from `docs/**`, `README.md`, `AGENTS.md`, `src/data/**`, or `package-lock.json` unless a later targeted slice explicitly requires it.

## Risks / Watchpoints

- Tooling churn can drown out semantic salvage if ESLint, Prettier, and alias changes land in one uncontrolled batch.
- `eslint-plugin-sonarjs` and `eslint-plugin-unused-imports` can create a large lint backlog if the rules are enabled too aggressively.
- Import ordering must follow the real alias shape of the repo (`@/*`), not the PR's broken `@core/@server/@ui` namespace config.
- A repo-wide import rewrite should only happen after alias resolution is verified in both Vite and Vitest.
- Any import/export or domain-code salvage must preserve deterministic codec behavior and existing branch data contracts.

## Progress Snapshot

- Done:
  - Created `pr14-salvage` as the curated salvage branch.
  - Created `pr14-reference` as a local mirror of the actual PR #14 head (`HerAnsu/SKeyDB:Refactoring-Code`).
  - Identified the real ESLint 10 blockers and separated viable packages from incompatible ones.
  - Reviewed the PR's Prettier config and narrowed the salvage direction to code/config formatting only.
  - Patched `package.json` and `eslint.config.js` for the initial ESLint 10-compatible salvage set.
  - Added `prettier.config.cjs` and `.prettierignore` with Markdown and JSON excluded from formatting scope.
  - Wired `@/*` alias support in `tsconfig.app.json` and `vite.config.ts`.
  - Ran `npm install` to refresh dependencies and `package-lock.json`.
  - Verified the tooling foundation with `npm run format:check`, `npm run lint`, `npm run build`, and `npm run test:quick`.
  - Rewrote parent-relative cross-folder `src` imports to `@/*` and re-verified the repo after the mechanical alias pass.
  - Fixed the `DetailLevelSlider` compact class regression uncovered by full verification and reran `npm run verify`.
  - Committed the mechanical salvage checkpoint as `34dd27d` (`chore: salvage tooling and alias groundwork`).
  - Confirmed the PR head is a single squashed commit, so commit-level equivalence is not enough to prove semantic salvage coverage.
  - Completed the file-by-file audit of the PR's single squashed commit and recorded the classification in `docs/notes/2026-03-06-pr14-single-commit-audit.md`.
  - Confirmed that, aside from the already-salvaged collection behavior slice and intentionally retained current-branch strictness/capability improvements, the remaining PR diff is mechanical churn, branch-local evolution, or newer current-branch additions.
  - Closed the loop on the plan/audit documentation so the branch no longer implies an unfinished broad PR14 review sweep.
- Next:
  - Keep this plan archived as historical context; any future salvage follow-up should start from fresh evidence instead of reopening this broad sweep.
- Blockers:
  - None for the audit itself; any new salvage work now requires fresh evidence rather than more generic PR14 diff burn-down.

## Verification

- `npm run lint`
- `npm run test:quick`
- `npm run build`
- `npm run verify`

### Task 1: ESLint 10-compatible tooling salvage

**Files:**
- Modify: `package.json`
- Modify: `eslint.config.js`
- Test: verification commands only (`npm run lint`, targeted Vitest commands)

**Step 1: Write the failing test**

Use lint itself as the failing check by adding an ESLint config/package combination that expects `eslint-plugin-sonarjs` and `eslint-plugin-unused-imports` to be present and wired.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: failure before install/update because the new packages and rules are not yet present in the lockfile and node_modules.

**Step 3: Write minimal implementation**

Update `package.json` to add only the ESLint 10-compatible salvage dependencies and any minimal helper scripts. Update `eslint.config.js` to enable the chosen high-signal rules without reintroducing the PR's incompatible plugins.

**Step 4: Run tests to verify it passes**

Run: `npm run lint`
Expected: PASS after dependency installation and any small follow-up fixes.

**Step 5: Commit**

```bash
git add package.json eslint.config.js package-lock.json
git commit -m "chore: salvage eslint 10 tooling"
```

### Task 2: Scoped Prettier adoption

**Files:**
- Create: `prettier.config.cjs`
- Create: `.prettierignore`
- Modify: `package.json`
- Test: verification commands only (`npm run format:check`, `npm run verify`)

**Step 1: Write the failing test**

Use Prettier check as the failing proof for the new formatting policy.

**Step 2: Run test to verify it fails**

Run: `npm run format:check`
Expected: failure until Prettier and the scoped config are installed and committed.

**Step 3: Write minimal implementation**

Add a conservative Prettier config for code/config files, include `bracketSpacing: false`, preserve Markdown prose, ignore JSON and Markdown content, and keep import ordering aligned with `@/*` and relative paths only.

**Step 4: Run tests to verify it passes**

Run: `npm run format:check`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json prettier.config.cjs .prettierignore package-lock.json
git commit -m "chore: add scoped prettier setup"
```

### Task 3: Alias infrastructure

**Files:**
- Modify: `tsconfig.app.json`
- Modify: `vite.config.ts`
- Modify: `package.json` if alias tooling is required
- Test: `npm run build`, `npm run test:quick`

**Step 1: Write the failing test**

Convert one safe local import to `@/*` only after the alias wiring is in place so the build/test failure proves the alias is not yet configured.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: failure resolving the `@/*` import before alias setup.

**Step 3: Write minimal implementation**

Add `@/*` to TypeScript path mapping and Vite resolution. Do not introduce `@core`, `@server`, or `@ui` aliases.

**Step 4: Run tests to verify it passes**

Run: `npm run build && npm run test:quick`
Expected: PASS

**Step 5: Commit**

```bash
git add tsconfig.app.json vite.config.ts package.json package-lock.json
git commit -m "chore: wire src alias support"
```

### Task 4: Import rewrite policy and mechanical cleanup

**Files:**
- Modify: touched `src/**/*.{ts,tsx}` files only
- Test: `npm run lint`, targeted Vitest commands

**Step 1: Write the failing test**

Pick one representative slice with deep relative imports and convert it to `@/*` so lint/build show unresolved or policy issues before the alias wiring is fully proven.

**Step 2: Run test to verify it fails**

Run: `npm run lint` or a targeted test/build command for the chosen slice.
Expected: failure until the alias infrastructure and formatting policy are stable.

**Step 3: Write minimal implementation**

Apply import rewrites in a deliberate batch. If review noise is too high, restrict the rewrite to touched files in the semantic salvage slices instead of the whole repo.

**Step 4: Run tests to verify it passes**

Run: `npm run lint && npm run test:quick`
Expected: PASS

**Step 5: Commit**

```bash
git add src
git commit -m "refactor: normalize src imports"
```

### Task 5: Semantic salvage slices

**Files:**
- Modify: `src/domain/*`
- Modify: `src/pages/builder/*`
- Modify: `src/pages/collection/*`
- Modify: selected `src/components/ui/*`
- Test: owning layer tests plus `npm run verify`

**Step 1: Write the failing test**

For each bug fix or behavior change salvaged from `pr14-reference`, add or update the nearest regression test first.

**Step 2: Run test to verify it fails**

Run: the specific `vitest` command for the targeted file or slice.
Expected: failure that matches the missing behavior.

**Step 3: Write minimal implementation**

Port only the semantic hunks that improve the current branch without dragging along unrelated formatting or docs churn.

**Step 4: Run tests to verify it passes**

Run: slice-specific tests, then `npm run lint`, and finally `npm run verify` before completing a substantial batch.
Expected: PASS

**Step 5: Commit**

```bash
git add [targeted files]
git commit -m "feat: salvage [slice name]"
```

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
