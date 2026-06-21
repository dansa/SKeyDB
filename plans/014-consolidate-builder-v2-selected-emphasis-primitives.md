# Plan 014: Consolidate Builder V2 Selected And Emphasis Primitives

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat bbf19359..HEAD -- src/index.css DESIGN.md PRODUCT.md src/features/builder-v2/builder-v2-shell.css src/features/builder-v2/builder-v2-picker.css src/features/builder-v2/builder-v2-team-slots.css src/features/builder-v2/builder-v2-team-management.css src/features/builder-v2/builder-v2-mobile.css scripts/verify-builder-v2-browser.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `bbf19359`, 2026-06-21

## Why this matters

Recent Builder V2 work centralized many visual tokens, but selected and emphasis
states still repeat local amber backgrounds, borders, rings, and success/danger
tones across picker tabs, picker chips, team-management modes, active rows,
mobile lineup controls, and quick-lineup actions. Restyling selected-state
contrast should be a small token change, not a hunt through many files. This
plan consolidates obvious repeated state recipes while leaving art-specific and
layout-specific tuning local.

## Current state

Relevant files:

- `src/index.css` - global `--ui-*` product tokens.
- `src/features/builder-v2/builder-v2-shell.css` - Builder V2 local token
  definitions.
- `src/features/builder-v2/builder-v2-picker.css` - active tabs and chips.
- `src/features/builder-v2/builder-v2-team-slots.css` - slot, wheel, covenant,
  quick-lineup action state styling.
- `src/features/builder-v2/builder-v2-team-management.css` - active modes, rows,
  danger controls, and overview cards.
- `src/features/builder-v2/builder-v2-mobile.css` - mobile active/hover target
  states.
- `DESIGN.md` and `PRODUCT.md` - design/product constraints.

Current excerpts:

```css
/* src/index.css:106 */
--ui-state-amber-border-soft: oklch(72% 0.07 84 / 0.44);
--ui-state-amber-border: oklch(78% 0.1 84 / 0.54);
--ui-state-amber-border-strong: oklch(78% 0.1 84 / 0.64);
--ui-state-amber-border-emphasis: oklch(78% 0.1 84 / 0.78);
--ui-state-amber-border-hot: oklch(82% 0.1 84 / 0.8);
--ui-state-amber-surface-soft: oklch(20% 0.05 84 / 0.12);
--ui-state-amber-surface: oklch(18% 0.045 84 / 0.16);
--ui-state-amber-surface-strong: oklch(20% 0.05 84 / 0.18);
```

```css
/* src/features/builder-v2/builder-v2-shell.css:41 */
--builder-v2-highlight-border: var(--ui-state-amber-border-strong);
--builder-v2-highlight-border-soft: oklch(74% 0.11 84 / 0.44);
--builder-v2-highlight-border-focus: oklch(78% 0.1 84 / 0.48);
--builder-v2-highlight-border-hot: oklch(78% 0.1 84 / 0.72);
--builder-v2-highlight-border-strong: var(--ui-state-amber-border-emphasis);
--builder-v2-highlight-bg: var(--ui-state-amber-surface);
--builder-v2-highlight-bg-strong: var(--ui-state-amber-surface-strong);
```

```css
/* src/features/builder-v2/builder-v2-picker.css:67 */
.builder-v2-tab--active {
  background: oklch(18% 0.045 84 / 0.12);
  color: var(--ui-accent-gold-soft);
  box-shadow: var(--builder-v2-active-underline);
}
```

```css
/* src/features/builder-v2/builder-v2-picker.css:147 */
.builder-v2-picker-chip--active {
  border-color: var(--ui-state-amber-border-strong);
  background: linear-gradient(180deg, oklch(22% 0.055 84 / 0.36), oklch(9% 0.028 252 / 0.88));
  color: var(--ui-accent-gold-soft);
}
```

```css
/* src/features/builder-v2/builder-v2-team-management.css:130 */
.builder-v2-team-management-mode-button--active {
  background: oklch(20% 0.055 84 / 0.2);
  color: var(--ui-accent-gold-soft);
  box-shadow:
    inset -1px 0 0 var(--builder-v2-section-divider-quiet),
    var(--builder-v2-active-underline);
}
```

```css
/* src/features/builder-v2/builder-v2-mobile.css:653 */
.builder-v2-mobile-lineup-header-action--active,
.builder-v2-mobile-lineup-header-action:hover,
.builder-v2-mobile-lineup-gear-button:not(.builder-v2-mobile-lineup-gear-button--inert):hover,
.builder-v2-mobile-lineup-gear-button--active,
.builder-v2-mobile-lineup-empty-choice--active,
.builder-v2-mobile-lineup-target-button--active,
```

```css
/* src/features/builder-v2/builder-v2-team-slots.css:241 */
.builder-v2-lineup-action--danger {
  border-color: var(--builder-v2-danger-border);
  color: var(--builder-v2-danger-text);
}
```

```css
/* src/features/builder-v2/builder-v2-team-slots.css:251 */
.builder-v2-lineup-action--success {
  border-color: oklch(72% 0.1 142 / 0.44);
  color: oklch(82% 0.1 142 / 0.92);
}
```

```md
<!-- DESIGN.md:121 -->
Amber Gold (`amber-gold`): The active-state and identity accent. Use for
selected controls, current page emphasis, focus aura, section markers, and
important serif headings.
```

Design constraints:

- Amber marks active selection, current identity, focus, or important headings.
  It is not filler decoration.
- Builder V2 can keep precise local tuning where it solves layout pressure.
- Any border, shadow, padding, or density change that can affect tight mobile or
  adaptive surfaces requires browser verification.

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
- `src/features/builder-v2/builder-v2-team-slots.css`
- `src/features/builder-v2/builder-v2-team-management.css`
- `src/features/builder-v2/builder-v2-mobile.css`

**Out of scope**:

- Broad visual redesign
- Changing layout dimensions, gaps, control heights, or breakpoints
- Moving Builder V2 tokens into `src/index.css` unless an exact token already
  belongs there
- Rewriting focus primitives; they are already centralized
- Rewriting picker state chips; they are already tokenized
- Generic card/tile surface unification beyond selected/emphasis state recipes

## Git workflow

- Branch: `codex/014-builder-v2-selected-primitives`
- Commit message example: `refactor: consolidate builder v2 selected state tokens`
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Define Builder V2 state recipe variables

In `builder-v2-shell.css`, add or rename local variables that describe reusable
state recipes rather than individual call sites.

Use names in this family:

- `--builder-v2-selected-border`
- `--builder-v2-selected-border-strong`
- `--builder-v2-selected-bg`
- `--builder-v2-selected-bg-strong`
- `--builder-v2-selected-inset`
- `--builder-v2-selected-ring`
- `--builder-v2-selected-underline`
- `--builder-v2-success-border`
- `--builder-v2-success-hover-border`
- `--builder-v2-success-bg`
- `--builder-v2-success-text`

Prefer aliases to existing `--ui-state-amber-*` and current `--builder-v2-*`
values. Do not change the visual values in this step unless a value is clearly
an accidental duplicate.

**Verify**:
`npm run format:check` exits 0.

### Step 2: Migrate active controls with no layout change

Replace local selected-state values in:

- `.builder-v2-tab--active`
- `.builder-v2-picker-chip--active`
- `.builder-v2-team-management-mode-button--active`
- `.builder-v2-team-row--active`
- `.builder-v2-team-management-row--active`
- `.builder-v2-mobile-team-chip--active`
- `.builder-v2-mobile-lineup-*--active` rule groups

Preserve selector names and property categories. For example, replace a local
amber background with `var(--builder-v2-selected-bg)`, but do not add new
padding, border width, grid changes, or new wrapper elements.

**Verify**:
`npm run format:check` and `npm run lint` exit 0.

### Step 3: Normalize danger and success tones for controls

Builder V2 already has danger variables. Add success variables beside them and
replace the obvious hard-coded success duplicates in:

- `.builder-v2-lineup-action--success`
- `.builder-v2-lineup-action--success:not(:disabled):hover`
- `.builder-v2-mobile-lineup-header-action--finish`

Also replace nested management danger overrides with existing danger variables
when the meaning is the same remove/destructive control.

Do not change drop-target remove styling such as `--builder-v2-remove-drop-bg`
unless it exactly duplicates a control danger token.

**Verify**:
`npm run format:check` exits 0.

### Step 4: Browser-check visual state preservation

Run:

```text
npm run verify:builder-v2:browser
```

Then manually inspect or capture at least:

- desktop `/builder-v2`
- adaptive/tablet width around `900x900`
- mobile width around `390x844`

Confirm active selected states remain visible for:

- active team row/rail
- active picker tab/chip
- selected active-team slot/gear target
- mobile quick-lineup active target
- team-management active row

**Verify**:
Browser smoke exits 0, and the final receipt records the three viewport checks.

## Test plan

- CSS state extraction is mostly visual, so do not add class snapshots.
- Keep `npm run test:integration:builder-v2` as behavior protection.
- Use browser smoke and manual viewport inspection as the state/overflow gate.

## Done criteria

- [ ] Selected/emphasis recipes are named in `builder-v2-shell.css`.
- [ ] Obvious active/selected rules derive from those recipes.
- [ ] Success action tones are centralized beside existing danger tones.
- [ ] No layout dimensions, breakpoints, or control sizes change.
- [ ] `npm run format:check` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test:integration:builder-v2` exits 0.
- [ ] `npm run verify:builder-v2:browser` exits 0.
- [ ] Final receipt records desktop, adaptive, and mobile visual checks.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- A selected-state migration requires changing layout dimensions or selectors
  used by tests/browser smoke.
- Active states become less visible in any viewport.
- The work turns into a generic card/tile surface redesign.
- The browser smoke reports overflow or missing Builder V2 surfaces.
- You find that a hard-coded value is intentionally different for an
  art-specific treatment and cannot safely become a token alias.

## Maintenance notes

After this lands, reviewers should expect new Builder V2 selected states to use
the selected/emphasis variables first. Local OKLCH values are still allowed when
they are documenting a genuinely local art, danger, or density treatment.
