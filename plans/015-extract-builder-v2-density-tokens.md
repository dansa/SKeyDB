# Plan 015: Extract Builder V2 Density Tokens

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat bbf19359..HEAD -- DESIGN.md PRODUCT.md src/features/builder-v2/builder-v2-shell.css src/features/builder-v2/builder-v2-picker.css src/features/builder-v2/builder-v2-adaptive.css src/features/builder-v2/builder-v2-mobile.css src/features/builder-v2/builder-v2-team-management.css src/features/builder-v2/builder-v2-team-rail-density.ts scripts/verify-builder-v2-browser.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: `plans/014-consolidate-builder-v2-selected-emphasis-primitives.md` recommended
- **Category**: tech-debt
- **Planned at**: commit `bbf19359`, 2026-06-21

## Why this matters

Builder V2 density tuning is intentionally precise, especially in mobile and
adaptive layouts. The problem is not the precision; it is that related values
are spread across base, adaptive, mobile, narrow-mobile, and team-management
selectors. When tablet/desktop work needs a denser picker rail or a slightly
larger mobile target, the executor must currently find several local overrides
and hope they stay aligned. This plan routes existing values through semantic
density variables so future tuning has named seams and mandatory browser checks.

## Current state

Relevant files:

- `src/features/builder-v2/builder-v2-shell.css` - base Builder V2 layout and
  adaptive size variables.
- `src/features/builder-v2/builder-v2-picker.css` - base picker density values.
- `src/features/builder-v2/builder-v2-adaptive.css` - adaptive picker and active
  team density overrides.
- `src/features/builder-v2/builder-v2-mobile.css` - mobile board, picker, lineup,
  and narrow-height/width density overrides.
- `src/features/builder-v2/builder-v2-team-management.css` - team-management
  card/list density and breakpoint overrides.
- `src/features/builder-v2/builder-v2-team-rail-density.ts` - existing
  non-CSS density helper for team rail class names.
- `scripts/verify-builder-v2-browser.mjs` - browser smoke for desktop,
  adaptive, and mobile overflow/layout.

Current excerpts:

```css
/* src/features/builder-v2/builder-v2-shell.css:21 */
--builder-v2-adaptive-picker-rail-width: clamp(12.25rem, 23vw, 13rem);
--builder-v2-adaptive-picker-tab-height: 2.6rem;
--builder-v2-adaptive-primary-gap: 0.75rem;
--builder-v2-adaptive-active-min-height: 23rem;
--builder-v2-adaptive-active-target-height: clamp(
  var(--builder-v2-adaptive-active-min-height),
  58vw,
  31rem
);
```

```css
/* src/features/builder-v2/builder-v2-picker.css:1 */
.builder-v2-picker-content {
  --builder-v2-picker-tab-height: var(--builder-v2-team-rail-row-height);
  --builder-v2-picker-tab-padding: 0.35rem;
  --builder-v2-picker-tab-font-size: 0.72rem;
  --builder-v2-picker-toolbar-gap: 0.48rem;
```

```css
/* src/features/builder-v2/builder-v2-adaptive.css:198 */
.builder-v2-adaptive-picker .builder-v2-picker-content {
  --builder-v2-picker-tab-height: var(--builder-v2-adaptive-picker-tab-height);
  --builder-v2-picker-tab-font-size: 0.66rem;
  --builder-v2-picker-toolbar-gap: 0.42rem;
  --builder-v2-picker-toolbar-padding: 0.32rem 0.38rem;
  --builder-v2-picker-search-min-height: 2rem;
```

```css
/* src/features/builder-v2/builder-v2-mobile.css:1 */
.builder-v2-page--mobile {
  --builder-v2-mobile-board-gap: clamp(0.32rem, 1.8vw, 0.48rem);
  --builder-v2-mobile-control-bg:
    linear-gradient(180deg, oklch(11.5% 0.028 252 / 0.92), oklch(7% 0.022 252 / 0.95)),
    var(--ui-panel-strong);
  --builder-v2-mobile-slot-card-height: clamp(12.8rem, 56vw, 14.8rem);
  --builder-v2-mobile-wheel-column-width: clamp(3.15rem, 29%, 4rem);
```

```css
/* src/features/builder-v2/builder-v2-mobile.css:708 */
.builder-v2-mobile-lineup-picker .builder-v2-picker-content,
.builder-v2-mobile-picker .builder-v2-picker-content {
  --builder-v2-picker-search-min-height: 2.5rem;
  --builder-v2-picker-menu-size: 2.5rem;
  --builder-v2-picker-chip-font-size: 0.58rem;
  --builder-v2-picker-filter-stack-gap: 0.28rem;
```

```css
/* src/features/builder-v2/builder-v2-mobile.css:986 */
@media (max-height: 44rem) {
  .builder-v2-mobile-view--lineup {
    gap: 0.28rem;
  }
```

```css
/* src/features/builder-v2/builder-v2-team-management.css:1201 */
.builder-v2-team-management--preview-compact .builder-v2-team-management-slot-state {
  top: 0.16rem;
  right: 0.16rem;
  bottom: auto;
  left: 0.16rem;
```

```css
/* src/features/builder-v2/builder-v2-team-management.css:1277 */
.builder-v2-team-management--adaptive.builder-v2-team-management--preview-expanded
  .builder-v2-team-management-slots,
.builder-v2-team-management--mobile.builder-v2-team-management--preview-expanded
  .builder-v2-team-management-slots {
  grid-template-columns: repeat(4, minmax(5rem, 7rem));
  overflow-x: auto;
```

```ts
// src/features/builder-v2/builder-v2-team-rail-density.ts:7
export function getBuilderV2TeamRailDensity({
  canAddTeam,
  maxTeams,
  teamCount,
}: {
```

Design constraints:

- `PRODUCT.md` targets WCAG 2.2 AA and at least 40px touch targets on mobile
  when controls are repeated or densely clustered.
- `DESIGN.md` allows dense 0.5-0.9rem internal padding and compact controls, but
  Builder V2 must still pass real browser layout checks.
- Do not ban local `clamp()` values or pixel/rem tuning; give repeated values
  names so future tuning has a safe entry point.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Format check | `npm run format:check` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Builder V2 integration gate | `npm run test:integration:builder-v2` | all tests pass |
| Browser smoke | `npm run verify:builder-v2:browser` | desktop/adaptive/mobile smoke passes |

## Scope

**In scope**:

- `src/features/builder-v2/builder-v2-shell.css`
- `src/features/builder-v2/builder-v2-picker.css`
- `src/features/builder-v2/builder-v2-adaptive.css`
- `src/features/builder-v2/builder-v2-mobile.css`
- `src/features/builder-v2/builder-v2-team-management.css`
- `src/features/builder-v2/builder-v2-team-rail-density.ts` only if a class-name
  token bridge is needed; no behavior change

**Out of scope**:

- Changing the visual design or target densities
- Adding new breakpoints
- Reworking mobile quick-lineup flow
- Changing team rail density logic
- Moving feature-specific density tokens into global `src/index.css`
- Running a formatter in write mode

## Git workflow

- Branch: `codex/015-builder-v2-density-tokens`
- Commit message example: `refactor: extract builder v2 density tokens`
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Inventory existing density values before editing

Create a short working inventory in your final receipt, grouped by:

- base picker density
- adaptive picker density
- mobile picker/dialog density
- mobile quick-lineup density
- team-management compact/expanded density

Do not commit the inventory unless asked. Use it to avoid accidental value
changes.

**Verify**:
No file changes yet. `git diff --stat` should be empty before Step 2.

### Step 2: Add semantic density variables without changing values

In `builder-v2-shell.css`, define base variables that alias current values.

Use names like:

- `--builder-v2-density-control-min-height`
- `--builder-v2-density-control-min-height-compact`
- `--builder-v2-density-picker-tab-height`
- `--builder-v2-density-picker-toolbar-gap`
- `--builder-v2-density-picker-chip-gap`
- `--builder-v2-density-picker-chip-min-height`
- `--builder-v2-density-slot-grid-gap`
- `--builder-v2-density-slot-grid-padding`
- `--builder-v2-density-team-card-gap`

Scope mobile/adaptive overrides on `.builder-v2-page--adaptive` and
`.builder-v2-page--mobile` instead of adding more one-off selector literals.

**Verify**:
`npm run format:check` exits 0.

### Step 3: Route picker density through the variables

Update `builder-v2-picker.css`, `builder-v2-adaptive.css`, and
`builder-v2-mobile.css` so picker tab/search/menu/chip/results dimensions still
resolve to the same computed values but use named density variables.

Do not change:

- `--builder-v2-picker-column-min-width`
- `--builder-v2-picker-column-max-width`
- windowing spacer behavior
- picker results `max-height`

**Verify**:
`npm run format:check` exits 0.

### Step 4: Route active-team and mobile lineup density through variables

Update repeated slot grid, mobile board, lineup target size, and quick-lineup
compression values to use semantic variables.

Keep current values, including:

- `2.75rem` mobile lineup target size at normal mobile width
- `2.65rem` target size at very narrow widths
- `2.5rem` mobile picker chip/search/menu minimums in quick-lineup contexts
- current `clamp()` slot-card heights

If a value exists only once and is clearly a local art or text alignment tweak,
leave it local.

**Verify**:
`npm run verify:builder-v2:browser` exits 0.

### Step 5: Route team-management density through variables

Normalize repeated team-management gaps, paddings, button sizes, and compact vs
expanded preview values through variables scoped on:

- `.builder-v2-team-management`
- `.builder-v2-team-management--preview-compact`
- `.builder-v2-team-management--preview-expanded`
- `.builder-v2-team-management--adaptive`
- `.builder-v2-team-management--mobile`

Do not change the behavior of `getBuilderV2TeamRailDensity`; it is about team
count and rail class names, not CSS spacing values.

**Verify**:
`npm run format:check` and `npm run lint` exit 0.

### Step 6: Browser-check all responsive surfaces

Run:

```text
npm run verify:builder-v2:browser
```

Then manually inspect or capture:

- desktop `1365x900`
- adaptive/tablet around `900x900`
- mobile `390x844`
- a short mobile height near `390x700`
- a narrow mobile width near `360x844`

Confirm:

- no horizontal document overflow
- mobile quick-lineup controls remain reachable
- team management rows do not overlap controls
- picker search/chips/results stay visible
- selected states remain legible

**Verify**:
Browser smoke exits 0 and the final receipt records the extra manual viewports.

## Test plan

- Existing Builder V2 tests protect behavior; density is browser-verified.
- Do not add jsdom tests for computed pixel sizes.
- Add tests only if the refactor changes markup or class names used by behavior.

## Done criteria

- [ ] Density variables exist for base, adaptive, mobile, quick-lineup, and
      team-management density seams.
- [ ] Existing values are routed through variables without intentional visual
      redesign.
- [ ] No new breakpoints are added.
- [ ] `npm run format:check` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test:integration:builder-v2` exits 0.
- [ ] `npm run verify:builder-v2:browser` exits 0.
- [ ] Final receipt records desktop, adaptive, mobile, short-mobile, and
      narrow-mobile checks.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- Matching current values becomes impossible without changing layout.
- Browser smoke reports overflow, missing surfaces, or DnD geometry failure.
- The work starts redesigning densities instead of naming existing seams.
- The change requires modifying React layout code.
- Team rail density behavior would need to change.

## Maintenance notes

Future tablet/desktop tuning should start by adjusting scoped density variables
and then running browser smoke. Local one-off spacing is still acceptable when
it solves a specific art, text, or collision problem that would not benefit from
a named density seam.
