# Plan 005: Normalize Mobile Quick-Lineup Density Safely

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/features/builder-v2/BuilderV2MobileLayout.tsx src/features/builder-v2/BuilderV2AwakenerPicker.tsx src/features/builder-v2/builder-v2.css src/features/builder-v2/BuilderV2Page.test.tsx PRODUCT.md DESIGN.md`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/003-add-builder-v2-browser-smoke-verification.md` recommended, but not required
- **Category**: direction
- **Planned at**: commit `ffe8f431`, 2026-06-18
- **Execution**: DONE, 2026-06-20
- **Completion note**: Addressed to the current layout's practical limit. Empty
  quick-lineup overview gear cells are decorative instead of tiny redirect
  buttons; filled-slot rail gear shortcuts remain a documented secondary
  exception because expanding them to 40px would overlap neighboring cells. The
  bottom slot toolbar is the compliant primary wheel/covenant path.

## Why This Matters

Builder V2 mobile quick-lineup is intentionally dense, but some repeated
controls are below the product's own mobile touch target floor. Simply making
everything 40px can break the tight design; expanding hitboxes outside the
visual box only works when there is actual surrounding space. This plan starts
with measuring layout budget, then chooses between larger controls, grouped
controls, or reduced visible control count.

## Current State

Relevant files:

- `PRODUCT.md` - accessibility floor and product direction.
- `DESIGN.md` - current visual canon.
- `src/features/builder-v2/BuilderV2MobileLayout.tsx` - mobile builder and
  quick-lineup structure.
- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx` - shared picker controls
  reused inside mobile lineup.
- `src/features/builder-v2/builder-v2.css` - mobile lineup control sizing.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - mobile page tests.

Current excerpts:

```md
// PRODUCT.md:46
Target WCAG 2.2 AA for product surfaces. Maintain keyboard access, visible
focus, semantic buttons and links, readable contrast on dark backgrounds, and
touch targets of at least 40 px on mobile when controls are repeated or densely
clustered.
```

```css
/* src/features/builder-v2/builder-v2.css:5392 */
.builder-v2-mobile-lineup-picker .builder-v2-picker-chip {
  min-height: 1.68rem;
  padding: 0.28rem 0.4rem;
  font-size: 0.57rem;
}
```

```css
/* src/features/builder-v2/builder-v2.css:5425 */
.builder-v2-mobile-lineup-header-action {
  min-height: 1.65rem;
  padding-right: 0.38rem;
  padding-left: 0.38rem;
  font-size: 0.5rem;
}
```

```css
/* src/features/builder-v2/builder-v2.css:5556 */
.builder-v2-mobile-lineup-picker .builder-v2-picker-chip {
  min-height: 1.48rem;
  padding: 0.22rem 0.34rem;
  font-size: 0.54rem;
}
```

Design constraints:

- `PRODUCT.md:52` says Timeline/D-zone guidelines are the working set for
  Builder redesigns.
- The current mobile layout is tight; do not assume invisible hitbox expansion
  is safe unless measurements prove non-overlap.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Mobile tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Browser smoke if plan 003 exists | `npm run verify:builder-v2:browser` | exit 0 |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/BuilderV2MobileLayout.tsx`
- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
- `src/features/builder-v2/builder-v2.css`
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Mobile DnD.
- Desktop/adaptive redesign except incidental shared picker fixes.
- Replacing the whole mobile flow.
- Adding new dependencies.

## Git Workflow

- Branch: `codex/005-mobile-lineup-density`.
- Commit message example: `fix: improve builder v2 mobile touch targets`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Measure the controls before changing CSS

Create a short inventory in your working notes, not necessarily committed:

- Controls below 40px visual height.
- Controls that can safely grow within existing layout.
- Controls that cannot grow without pushing critical content off screen.
- Controls where an expanded pseudo-element hitbox has enough surrounding gap.

Use browser devtools or the browser smoke from plan 003 at:

- `390x844`
- a short mobile height such as `390x700`
- a narrow width around `360px`

**Verify**:
Record the measured controls and chosen approach in your final receipt.

### Step 2: Fix the worst repeated controls without breaking flow

Start with quick-lineup picker chips and header actions. Choose the least
harmful solution per control:

- Increase visual min-height to at least 40px when it fits.
- If a control must remain visually smaller, add a pseudo-element hit target
  only when there is enough space around it and no neighboring hitboxes overlap.
- If neither fits, reduce visible control count or group secondary actions
  behind a larger control. Do not hide critical quick-lineup actions.

Keep text readable. Avoid dropping font sizes below the current design system's
legible floor. Preserve visible focus states.

**Verify**:
Run `npm run verify:builder-v2:browser` if available, or manually inspect the
three mobile viewports and record results.

### Step 3: Add regression coverage for mobile structure

In `src/features/builder-v2/BuilderV2Page.test.tsx`, add or update tests that
ensure quick-lineup controls remain reachable by role/name at mobile width.
Do not test CSS pixel sizes in jsdom; use browser smoke or manual measurements
for actual sizing.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

### Step 4: Re-check dense states

Test at least:

- Empty team quick-lineup.
- Partially filled team quick-lineup.
- Picker open on awakeners and wheels.
- Short-height viewport with filters visible.

**Verify**:
No horizontal document overflow, no overlapping tap targets, and no hidden
critical action in the checked states.

## Test Plan

- Page tests for reachable mobile quick-lineup controls.
- Browser smoke or manual measurements for actual touch target geometry.
- Focus checks for at least one adjusted control.

## Execution Notes

- Mobile quick-lineup no longer renders picker category tabs. The active quick
  lineup step owns the picker category, so the removed tab strip returns vertical
  budget to the controls that are useful in the guided flow.
- Quick-lineup search, options menu, filter chips, header actions, posse target,
  and bottom slot controls were raised to at least 40px in the measured mobile
  states.
- Filter chips use horizontal overflow where needed instead of wrapping extra
  rows into the short mobile viewport.
- Empty top-rail gear cells are inert visual placeholders. They no longer add
  sub-40px buttons that redirect to the awakener slot.
- Filled-slot top-rail gear cells remain interactive secondary shortcuts. Real
  browser measurement showed a 40px hit area would overlap neighboring cells, so
  the bottom toolbar remains the primary accessible path for gear selection.
- Browser measurements covered `390x844`, `390x700`, and `360x844`. The checked
  states had no document overflow and no console/page errors.

## Done Criteria

- [x] Repeated mobile quick-lineup controls meet the 40px target where feasible;
      filled-slot overview gear shortcuts are documented above as a secondary
      exception because non-overlapping 40px expansion does not fit the current
      rail.
- [x] No critical quick-lineup action disappears at `390x844`, `390x700`, or
      `360px` width.
- [x] Visible focus remains clear.
- [x] `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.
- [x] `npm run verify:builder-v2:browser` passes if available, or manual
      viewport evidence is recorded.
- [x] `npx tsc -p tsconfig.app.json --noEmit` and `npm run lint` pass.

## STOP Conditions

Stop and report if:

- Meeting the 40px floor requires a fundamental mobile flow redesign.
- Hitbox expansion would overlap neighboring controls.
- The fix makes quick-lineup unusable on short mobile viewports.
- The design decision becomes product-level: remove controls, change flow, or
  introduce a new disclosure pattern.

## Maintenance Notes

Future mobile work should not reintroduce sub-40px repeated controls without an
explicit exception and measured non-overlap. Reviewers should inspect real
mobile viewport evidence, not only jsdom tests.
