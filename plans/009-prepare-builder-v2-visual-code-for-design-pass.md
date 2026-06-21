# Plan 009: Prepare Builder V2 Visual Code For The Design Pass

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/features/builder-v2/BuilderV2AwakenerPicker.tsx src/features/builder-v2/builder-v2.css src/features/builder-v2/BuilderV2Page.test.tsx DESIGN.md PRODUCT.md`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M-L
- **Risk**: MED
- **Depends on**: `plans/003-add-builder-v2-browser-smoke-verification.md` recommended
- **Category**: tech-debt
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

Builder V2 is headed into more design and UX polish. Today the visual code is
hard to move safely: one large CSS file holds page, picker, active-team,
team-management, adaptive, mobile, and DnD overlay styling, while the picker
component repeats tile/control patterns by entity type. Preparing these
boundaries before heavy polish reduces cascade drift and synchronized-edit
mistakes.

## Current State

Relevant files:

- `src/features/builder-v2/builder-v2.css` - 5,557-line Builder V2 stylesheet.
- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx` - 1,491-line picker with
  repeated tile/control structures.
- `DESIGN.md` and `PRODUCT.md` - current visual canon.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - page behavior coverage.

Current excerpts:

```css
/* src/features/builder-v2/builder-v2.css:1055 */
.builder-v2-awakener-action,
.builder-v2-covenant-inline-clear,
.builder-v2-equipment-clear {
  display: grid;
```

```css
/* src/features/builder-v2/builder-v2.css:3552 */
.builder-v2-team-management-loadout-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
```

```css
/* src/features/builder-v2/builder-v2.css:5088 */
.builder-v2-mobile-lineup-slot-nav,
.builder-v2-mobile-lineup-done-button,
.builder-v2-mobile-lineup-empty-choice,
.builder-v2-mobile-lineup-target-button {
```

```tsx
// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:957
const BuilderV2CovenantPickerTile = memo(function BuilderV2CovenantPickerTile({

// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:1051
const BuilderV2PossePickerTile = memo(function BuilderV2PossePickerTile({

// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:1500
function PickerChipRow({children, label}: {children: ReactNode; label: string}) {
```

Design canon:

```md
// DESIGN.md:106
The current visual canon is the Timeline and D-zone facelift. ... Builder and
Collection redesigns should move toward this language while respecting their
heavier interaction needs.
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Builder V2 page tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Browser smoke if available | `npm run verify:builder-v2:browser` | exit 0 |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Format check | `npm run format:check` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/builder-v2.css`
- New CSS files under `src/features/builder-v2/` imported by `BuilderV2Page.tsx`
  or `builder-v2.css`
- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
- New local picker primitive files under `src/features/builder-v2/`
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Visual redesign or new styling language.
- Mobile touch-target changes from plan 005.
- Picker virtualization from plan 007.
- CSS Modules migration unless the operator explicitly chooses it.

## Git Workflow

- Branch: `codex/009-builder-v2-visual-code-prep`.
- Commit message example: `refactor: prepare builder v2 visual boundaries`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Choose one tranche, not both

Pick exactly one of these tranches for this execution:

1. **CSS split first** - split the monolithic stylesheet without changing
   selectors or visual behavior.
2. **Picker primitive first** - extract shared picker tile/control primitives
   without changing visual behavior.

Default to CSS split if plan 005 is likely next; default to picker primitives if
plan 007 is likely next. Do not do both in one worker pass.

**Verify**:
Write the chosen tranche in the final receipt.

### Step 2A: CSS split tranche

If doing CSS split, create files such as:

- `builder-v2-page.css`
- `builder-v2-picker.css`
- `builder-v2-team-slots.css`
- `builder-v2-team-management.css`
- `builder-v2-dnd.css`
- `builder-v2-mobile.css`

Move existing selectors without changing selector names or declarations. Import
them in the same cascade order from `builder-v2.css`, or replace the import in
`BuilderV2Page.tsx` with ordered imports. Preserve cascade order exactly.

**Verify**:
`npm run format:check` and `npm run verify:builder-v2:browser` if available.

### Step 2B: Picker primitive tranche

If doing picker primitives, extract local components such as:

- `BuilderV2PickerTileFrame`
- `BuilderV2PickerTileButton`
- `BuilderV2PickerTileArt`
- `BuilderV2PickerChipRow`
- `BuilderV2PickerSortRow`

Keep per-kind option components responsible for labels, option-specific chips,
and DnD payload creation. Do not change accessible names or visual output.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

### Step 3: Add one anti-regression test only if behavior moved

If extraction changes component boundaries but not behavior, existing tests may
be enough. If an accessible name, detail button, or click assignment path moved,
add a focused test to `BuilderV2Page.test.tsx`.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

### Step 4: Run visual/browser guard

Run the browser smoke from plan 003 if available. If not available, manually
check desktop, adaptive, and mobile Builder V2 render without obvious missing
styles.

**Verify**:
`npm run verify:builder-v2:browser` passes or manual evidence is recorded.

## Test Plan

- Existing Builder V2 page tests.
- Browser smoke/manual render check for desktop/adaptive/mobile.
- Format check, because CSS movement is easy to misformat.

## Done Criteria

- [ ] Exactly one tranche was executed: CSS split or picker primitive extraction.
- [ ] No visual redesign is included.
- [ ] Accessible names and click assignment behavior are preserved.
- [ ] `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.
- [ ] Browser smoke/manual render evidence covers desktop, adaptive, and mobile.
- [ ] `npx tsc -p tsconfig.app.json --noEmit`, `npm run lint`, and
      `npm run format:check` pass.

## STOP Conditions

Stop and report if:

- Cascade order cannot be preserved without changing visuals.
- Picker primitive extraction starts changing tile behavior or DnD payloads.
- The tranche expands into mobile density, virtualization, or redesign work.

## Maintenance Notes

This plan is preparatory. Reviewers should reject visual drift unless the
operator explicitly widened the scope. After this lands, future design work
should target the smaller CSS/component boundaries instead of adding more late
overrides to a single file.
