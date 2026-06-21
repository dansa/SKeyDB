# Plan 003: Add Builder V2 Browser Smoke Verification

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- package.json package-lock.json scripts src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/builder-v2.css vite.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **State**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

Builder V2 is mostly protected by jsdom and pure tests. The riskiest regressions
remaining are browser-only: responsive layout, clipped overlays, pointer hit
targets, drag/drop lifecycle behavior, and focus visibility. A lightweight
browser smoke gives future mobile, DnD, and design work a real viewport guard
without turning every style change into a brittle visual snapshot.

## Current State

Relevant files:

- `package.json` - `verify` currently runs format, lint, bounded Vitest, script
  tests, and build, but no browser smoke.
- `vitest.config.ts` - tests use jsdom.
- `src/features/builder-v2/BuilderV2Page.tsx` - DnD and viewport-mode routing.
- `src/features/builder-v2/builder-v2.css` - layout, overlay, mobile, and
  responsive styling.
- `scripts/` - existing repo tooling location.

Current excerpts:

```json
// package.json:28
"verify": "npm run format:check && npm run lint && npm run test:bounded && npm run test:scripts && npm run build"
```

```ts
// vitest.config.ts:13
test: {
  environment: 'jsdom',
```

```tsx
// src/features/builder-v2/BuilderV2Page.tsx:319
<DndContext
  collisionDetection={dnd.collisionDetection}
  sensors={dnd.sensors}
  onDragCancel={dnd.handleDragCancel}
  onDragEnd={dnd.handleDragEnd}
```

```tsx
// src/features/builder-v2/BuilderV2Page.tsx:130
if (viewportMode === 'mobile') {
  content = (
    <BuilderV2MobileLayout
```

Repo constraints:

- If this plan adds a dev dependency, run dependency-mutating commands through
  Socket Firewall, for example `sfw npm install -D @playwright/test`.
- Keep browser assertions stable and semantic. Avoid pixel-perfect screenshot
  diffs unless the repo intentionally adopts them later.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Check for Playwright | `node -e "import('@playwright/test').then(()=>console.log('present')).catch(()=>process.exit(1))"` | exit 0 if already installed |
| Install browser runner if approved | `sfw npm install -D @playwright/test` | exit 0, lockfile updated |
| Browser smoke | `npm run verify:builder-v2:browser` | exit 0 |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build:quiet` | exit 0 |

## Scope

**In scope**:

- `package.json`
- `package-lock.json` only if adding a browser test dependency
- `scripts/verify-builder-v2-browser.mjs` or equivalent script under `scripts/`
- Optional `playwright.config.ts` only if using Playwright config is cleaner
- `.gitignore` only if the browser runner creates new ignored artifacts

**Out of scope**:

- Product CSS or component changes, except tiny test-id/aria-label additions if
  an existing semantic selector is impossible.
- Full visual regression suite.
- CI workflow changes unless the operator explicitly asks to include this in CI.
- Mobile DnD implementation.

## Git Workflow

- Branch: `codex/003-builder-v2-browser-smoke`.
- Commit message example: `test: add builder v2 browser smoke`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Decide the browser runner without guessing

Check whether a browser automation dependency already exists. If Playwright is
not available, ask the operator whether adding `@playwright/test` as a dev
dependency is approved. If approval is not available, STOP and report that this
plan needs a dependency decision.

If approved, install with Socket Firewall:

```powershell
sfw npm install -D @playwright/test
```

**Verify**:
`node -e "import('@playwright/test').then(()=>console.log('present')).catch(()=>process.exit(1))"`
prints `present`.

### Step 2: Add a focused smoke script

Create `scripts/verify-builder-v2-browser.mjs` or a Playwright test file plus
script. It should:

1. Start or reuse a Vite dev server.
2. Open `/#/builder-v2` or `/builder-v2` according to the app's routing mode.
3. Check desktop viewport around `1365x900`.
4. Check adaptive viewport around `900x900`.
5. Check mobile viewport around `390x844`.

Assertions should be semantic and robust:

- The Builder V2 heading or mobile builder region is visible.
- No obvious horizontal document overflow at each viewport.
- The active builder, picker/armory, and teams surfaces expected for that
  viewport are present.
- A focused interactive control has a visible focus outline or measurable focus
  state.
- A simple pointer DnD smoke on desktop/adaptive either succeeds or is skipped
  with a clear reason. Do not overfit to fragile drag coordinates.

**Verify**:
`npm run verify:builder-v2:browser` passes locally.

### Step 3: Wire npm scripts

Add `verify:builder-v2:browser` to `package.json`. Do not add it to `verify` by
default unless the operator explicitly wants CI/pre-commit to pay this cost.

If you add Playwright, add any required browser install command notes to the
script or README only if necessary. Prefer the smallest reliable setup.

**Verify**:
`npm run verify:builder-v2:browser` exits 0 from a clean terminal.

### Step 4: Keep artifacts controlled

If the browser runner emits screenshots, traces, or reports, put them under an
ignored temp/report directory. Do not commit generated screenshots unless the
operator requested visual baselines.

**Verify**:
`git status --short` shows only intentional source/config changes.

## Test Plan

- The new smoke command is the test.
- Run `npm run build:quiet` after adding scripts/dependencies to ensure Vite
  build remains healthy.

## Done Criteria

- [x] `npm run verify:builder-v2:browser` exists and passes.
- [x] The smoke covers desktop, adaptive, and mobile Builder V2 viewports.
- [x] Browser assertions are semantic and not pixel-perfect.
- [x] Generated artifacts are ignored or not created.
- [x] `npx tsc -p tsconfig.app.json --noEmit`, `npm run lint`, and
      `npm run build:quiet` pass.
- [x] If a dependency was added, it was installed with `sfw` and both
      `package.json` and `package-lock.json` are updated.

## STOP Conditions

Stop and report if:

- Adding a browser automation dependency is not approved.
- Browser automation requires brittle coordinate-only assertions for all useful
  checks.
- The smoke requires product behavior changes to pass.
- The command cannot run on Windows PowerShell without shell-specific hacks.

## Maintenance Notes

This is a smoke gate, not a comprehensive E2E suite. Future plans that change
mobile layout, picker virtualization, DnD overlays, or large CSS structure
should run this command and mention its result in their final receipt.
