# Plan 011: Extract Builder V2 Equipment Target Primitive

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat bbf19359..HEAD -- src/features/builder-v2/BuilderV2TeamSlots.tsx src/features/builder-v2/builder-v2-team-slots.css src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-dnd.test.ts`
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

Builder V2 has one shared visual family for slot equipment targets: wheel
targets and covenant targets. Today those controls are implemented separately
inside `BuilderV2TeamSlots.tsx`, including active classes, drop-target classes,
DnD refs/listeners, empty fallback art, and clear buttons. The duplication is
small enough to look harmless but risky enough that tablet/desktop/mobile slot
changes can drift in DnD wiring, accessible names, or selected-state treatment.

## Current state

Relevant files:

- `src/features/builder-v2/BuilderV2TeamSlots.tsx` - active team slot grid and
  the duplicated wheel/covenant equipment controls.
- `src/features/builder-v2/builder-v2-team-slots.css` - equipment target and
  clear-button styling.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - interaction coverage for
  assigning and clearing slot equipment.
- `src/features/builder-v2/builder-v2-dnd.test.ts` - pure DnD resolver coverage.

Current excerpts:

```tsx
// src/features/builder-v2/BuilderV2TeamSlots.tsx:140
const renderCovenantSlot = (variant: 'meta' | 'rail') => {
  return (
    <div className={`builder-v2-covenant-slot builder-v2-covenant-slot--${variant}`}>
      <button
        {...(canDragCovenant && covenantDragListeners ? covenantDragListeners : {})}
        aria-label={`Select ${slot.slotLabel} Covenant`}
        aria-pressed={slot.isCovenantSelected}
        className={`builder-v2-covenant-inline ${
          slot.isCovenantSelected ? 'builder-v2-covenant-inline--active' : ''
        } ${isCovenantDropTarget ? 'builder-v2-covenant-inline--drop-target' : ''} ${
          slot.covenantAssetSrc ? '' : 'builder-v2-covenant-inline--empty'
        }`}
```

```tsx
// src/features/builder-v2/BuilderV2TeamSlots.tsx:467
function SlotWheelChip({
  onClear,
  onSelect,
  quickLineupActive,
  isDragActive,
  predictedDropTarget,
  slot,
  wheelSlot,
}: {
```

```tsx
// src/features/builder-v2/BuilderV2TeamSlots.tsx:504
return (
  <div
    className={`builder-v2-wheel-chip ${
      wheelSlot.isSelected ? 'builder-v2-wheel-chip--active' : ''
    } ${isWheelDropTarget ? 'builder-v2-wheel-chip--drop-target' : ''}`}
  >
    <button
      {...(canDragWheel && wheelDragListeners ? wheelDragListeners : {})}
      aria-label={`Select ${wheelSlot.label}`}
      aria-pressed={wheelSlot.isSelected}
      className='builder-v2-wheel-target'
```

```tsx
// src/features/builder-v2/BuilderV2TeamSlots.tsx:444
function useMergedRefs<T extends HTMLElement>(
  firstRef: (element: T | null) => void,
  secondRef: (element: T | null) => void,
) {
```

```css
/* src/features/builder-v2/builder-v2-team-slots.css:1014 */
.builder-v2-covenant-inline {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
```

```css
/* src/features/builder-v2/builder-v2-team-slots.css:1081 */
.builder-v2-wheel-chip {
  display: grid;
  position: relative;
  overflow: hidden;
```

```tsx
// src/features/builder-v2/BuilderV2Page.test.tsx:1641
it('assigns and clears wheel and covenant loadout targets', () => {
```

Repo conventions to follow:

- Keep Builder V2 primitives local to `src/features/builder-v2/`; do not move
  them into global UI unless another feature already consumes the same contract.
- Keep DnD payload creation explicit in `BuilderV2TeamSlots.tsx`; the primitive
  should receive prepared binding props, not learn slot/team domain rules.
- Match existing low-radius token styling from `DESIGN.md`: product controls use
  `var(--ui-radius-xs)` and amber marks state, not decoration.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Focused page tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| DnD tests | `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run` | all tests pass |
| Builder V2 integration gate | `npm run test:integration:builder-v2` | all tests pass |
| Browser smoke | `npm run verify:builder-v2:browser` | desktop/adaptive/mobile smoke passes |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/BuilderV2TeamSlots.tsx`
- `src/features/builder-v2/builder-v2-team-slots.css` only if a selector rename
  or small class consolidation is unavoidable
- `src/features/builder-v2/BuilderV2Page.test.tsx` only for focused behavior
  coverage if existing tests stop covering moved behavior

**Out of scope**:

- Changing DnD payload factories or resolver behavior in `builder-v2-dnd.ts`
- Changing picker rendering in `BuilderV2AwakenerPicker.tsx`
- Changing visual design, dimensions, colors, or breakpoints
- Replacing mobile quick-lineup controls; that is plan 013
- Adding dependencies

## Git workflow

- Branch: `codex/011-builder-v2-equipment-target`
- Commit message example: `refactor: extract builder v2 equipment target primitive`
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Characterize the current equipment behavior

Run the existing tests before editing:

```text
npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-dnd.test.ts --run
```

Confirm these interactions are covered:

- selecting wheel and covenant targets by accessible name
- clearing wheel and covenant targets
- DnD resolver behavior for wheel and covenant drops

If existing tests fail before edits, stop and report the pre-existing failure.

**Verify**:
The command exits 0.

### Step 2: Extract the narrow primitive inside `BuilderV2TeamSlots.tsx`

Add a local component near `SlotWheelChip`, for example
`BuilderV2EquipmentTarget`.

It should own only the shared button/control shell:

- wrapper class and active/drop-target class composition
- `aria-label`, `aria-pressed`, `title`, and `type='button'`
- `onClick` with restore-target support through `event.currentTarget`
- optional clear button with its own accessible name
- optional image/fallback rendering
- optional prepared `listeners` and `ref`

Keep these outside the primitive:

- `createBuilderV2TeamWheelDragPayload`
- `createBuilderV2TeamCovenantDragPayload`
- `makeBuilderV2WheelDndId`
- `makeBuilderV2CovenantDndId`
- slot-specific labels such as `Select Slot 1 Wheel 1`

**Verify**:
`npx tsc -p tsconfig.app.json --noEmit` exits 0.

### Step 3: Replace wheel and covenant callers one at a time

First migrate `SlotWheelChip` to the primitive. Then migrate
`renderCovenantSlot`.

Preserve exactly:

- `aria-label` strings
- `aria-pressed` values
- clear button labels
- DnD IDs and payload data
- disabled behavior when DnD is unavailable
- focus behavior from the existing button receiving `event.currentTarget`

Do not rename CSS classes unless keeping the old class names makes the primitive
impossible to read. If selector renames are needed, keep a compatibility alias
for this plan and remove it only in a later CSS cleanup.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` exits 0.

### Step 4: Browser-check DnD geometry

Run the existing browser smoke because this component owns DnD-visible DOM and
button geometry:

```text
npm run verify:builder-v2:browser
```

The script covers desktop `1365x900`, adaptive `900x900`, and mobile `390x844`;
it opens the mobile picker, checks horizontal overflow, and runs pointer DnD on
desktop/adaptive.

**Verify**:
The command exits 0 and prints passing desktop, adaptive, and mobile smoke
messages.

## Test plan

- Use existing `BuilderV2Page.test.tsx` coverage for assignment and clearing.
- Use existing `builder-v2-dnd.test.ts` coverage for resolver semantics.
- Add a focused page test only if the refactor moves a behavior that is not
  already asserted by role/name.

## Done criteria

- [ ] Wheel and covenant target rendering share one narrow local primitive.
- [ ] DnD payload creation and resolver logic remain outside the primitive.
- [ ] Accessible names and clear button labels are unchanged.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` exits 0.
- [ ] `npm run test:integration:builder-v2` exits 0.
- [ ] `npm run verify:builder-v2:browser` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- The primitive needs to know how to build domain DnD payloads.
- Preserving DnD refs/listeners requires changing `builder-v2-dnd.ts`.
- Existing accessible names or clear-button semantics cannot be preserved.
- Browser smoke fails because DnD geometry changes in a way that is not a simple
  ref wiring mistake.
- The change starts pulling in mobile quick-lineup target controls.

## Maintenance notes

Future slot layout work should edit this primitive for shared equipment target
chrome and keep wheel/covenant differences in prepared props. Reviewers should
scrutinize ref wiring and accessible names more than line-count reduction.
