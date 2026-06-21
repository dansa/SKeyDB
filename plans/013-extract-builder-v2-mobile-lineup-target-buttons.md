# Plan 013: Extract Builder V2 Mobile Lineup Target Buttons

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat bbf19359..HEAD -- src/features/builder-v2/BuilderV2MobileLayout.tsx src/features/builder-v2/builder-v2-mobile.css src/features/builder-v2/BuilderV2Page.test.tsx scripts/verify-builder-v2-browser.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/012-extract-builder-v2-mobile-picker-target-resolution.md`
- **Category**: tech-debt
- **Planned at**: commit `bbf19359`, 2026-06-21

## Why this matters

Mobile quick-lineup has several visual/control dialects for the same idea:
select an awakener, wheel, covenant, or posse target. The current code repeats
`aria-current`, `aria-pressed`, active class names, fallback plus signs, image
rendering, and click wiring in separate branches. A mobile-only target-button
primitive reduces future churn while keeping the tight layout tuning local and
browser-verified.

## Current state

Relevant files:

- `src/features/builder-v2/BuilderV2MobileLayout.tsx` - mobile quick-lineup
  overview and bottom target panel.
- `src/features/builder-v2/builder-v2-mobile.css` - mobile lineup target,
  overview gear, and density styling.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - mobile quick-lineup
  coverage.
- `scripts/verify-builder-v2-browser.mjs` - browser smoke for real mobile
  layout and overflow.

Current excerpts:

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:612
<button
  aria-label={`Select ${slot.slotLabel}`}
  aria-pressed={slot.isSelected}
  className='builder-v2-mobile-lineup-awakener-target'
  onClick={() => {
    onSelectSlot(slot.slotId)
  }}
  type='button'
>
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:673
<button
  aria-label={wheelActionLabel}
  aria-pressed={wheelSlot.isSelected}
  className={`builder-v2-mobile-lineup-gear-button ${
    wheelSlot.isSelected ? 'builder-v2-mobile-lineup-gear-button--active' : ''
  }`}
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:708
<button
  aria-label={`Select ${slot.slotLabel} Covenant`}
  aria-pressed={slot.isCovenantSelected}
  className={`builder-v2-mobile-lineup-gear-button ${
    slot.isCovenantSelected ? 'builder-v2-mobile-lineup-gear-button--active' : ''
  }`}
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:821
{activeSlot.isEmpty ? (
  <button
    aria-current={isAwakenerActive ? 'step' : undefined}
    aria-label={`Select ${activeSlot.slotLabel} Awakener`}
    className={`builder-v2-mobile-lineup-empty-choice ${
      isAwakenerActive ? 'builder-v2-mobile-lineup-empty-choice--active' : ''
    }`}
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:838
<button
  aria-current={isAwakenerActive ? 'step' : undefined}
  aria-label={`Select ${activeSlot.slotLabel} Awakener`}
  aria-pressed={isAwakenerActive}
  className={`builder-v2-mobile-lineup-target-button builder-v2-mobile-lineup-target-button--avatar ${
    isAwakenerActive ? 'builder-v2-mobile-lineup-target-button--active' : ''
  }`}
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:867
<button
  aria-current={isWheelActive ? 'step' : undefined}
  aria-label={`Select ${activeSlot.slotLabel} Wheel ${wheelNumber}`}
  aria-pressed={isWheelActive}
  className={`builder-v2-mobile-lineup-target-button ${
    isWheelActive ? 'builder-v2-mobile-lineup-target-button--active' : ''
  }`}
```

```css
/* src/features/builder-v2/builder-v2-mobile.css:405 */
.builder-v2-mobile-lineup-gear-button {
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
```

```css
/* src/features/builder-v2/builder-v2-mobile.css:589 */
.builder-v2-mobile-lineup-target-button {
  display: grid;
  height: var(--builder-v2-lineup-target-size);
  min-width: 0;
```

```tsx
// src/features/builder-v2/BuilderV2Page.test.tsx:1487
it('renders mobile quick lineup with a compact four-slot overview row', () => {
```

```tsx
// src/features/builder-v2/BuilderV2Page.test.tsx:1527
it('keeps empty mobile quick lineup gear cells decorative while the slot card selects awakener', () => {
```

Repo conventions to follow:

- Keep mobile-only primitives local to `BuilderV2MobileLayout.tsx` unless they
  become large enough to justify a sibling file.
- Keep the larger overview awakener card separate if extracting it makes the
  primitive API broad or hard to read.
- Mobile visual density is tight. Browser evidence is required for layout
  changes; do not rely on jsdom for dimensions.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Mobile page tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Builder V2 integration gate | `npm run test:integration:builder-v2` | all tests pass |
| Browser smoke | `npm run verify:builder-v2:browser` | desktop/adaptive/mobile smoke passes |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/BuilderV2MobileLayout.tsx`
- `src/features/builder-v2/builder-v2-mobile.css` only for class aliasing if
  the primitive needs a small class-name cleanup
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Changing quick-lineup state machine behavior
- Changing picker-opening target resolution from plan 012
- Changing active target labels or button accessible names
- Changing mobile target sizes, layout rows, or breakpoints
- Refactoring desktop/adaptive slot controls

## Git workflow

- Branch: `codex/013-builder-v2-mobile-target-buttons`
- Commit message example: `refactor: extract builder v2 mobile target buttons`
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Re-run mobile quick-lineup tests before editing

Run:

```text
npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run
```

Confirm existing tests cover:

- compact four-slot overview row
- inert empty gear cells
- empty mobile gear target opening the awakener picker
- quick-lineup next/previous target navigation

If these tests fail before edits, stop and report the pre-existing failure.

**Verify**:
The command exits 0.

### Step 2: Extract a small target button primitive for the bottom panel

Start with the repeated bottom-panel buttons in
`BuilderV2MobileSlotTargetPanel`:

- awakener avatar target
- wheel target
- covenant target
- empty awakener choice only if it stays readable

The primitive should accept:

- `ariaLabel`
- `isActive`
- `isCurrentStep`
- `className` or `variant`
- `onClick`
- icon/image/fallback content
- visible label content when needed

Preserve `aria-current='step'` and `aria-pressed` exactly where they exist
today.

**Verify**:
`npx tsc -p tsconfig.app.json --noEmit` exits 0.

### Step 3: Extract the overview gear button separately

Add a second narrow helper only if needed, for the compact overview gear cells.
The overview gear helper should preserve:

- inert `<span aria-hidden='true'>` for empty slots
- wheel/covenant button labels
- `title` text
- active class names

Do not force the large overview awakener card into the same primitive unless the
result stays simpler than the current code.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` exits 0.

### Step 4: Keep CSS behavior stable

Prefer keeping existing class names:

- `builder-v2-mobile-lineup-gear-button`
- `builder-v2-mobile-lineup-gear-button--active`
- `builder-v2-mobile-lineup-target-button`
- `builder-v2-mobile-lineup-target-button--active`
- `builder-v2-mobile-lineup-target-button--avatar`
- `builder-v2-mobile-lineup-empty-choice`

If you must add a new wrapper class, it must not change layout, target size, or
focus ring placement.

**Verify**:
`npm run verify:builder-v2:browser` exits 0.

## Test plan

- Existing `BuilderV2Page.test.tsx` mobile quick-lineup tests should continue
  passing.
- Add a focused test only if a previously unasserted target loses
  `aria-current`, `aria-pressed`, or a role/name.
- Use browser smoke for real mobile geometry.

## Done criteria

- [ ] Bottom-panel mobile target buttons share one small primitive or helper.
- [ ] Compact overview wheel/covenant gear buttons share a helper, while inert
      empty gear cells remain non-buttons.
- [ ] The large overview awakener card remains separate unless the extracted API
      is clearly smaller and simpler.
- [ ] No target label, `aria-current`, or `aria-pressed` semantics change.
- [ ] `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` exits 0.
- [ ] `npm run test:integration:builder-v2` exits 0.
- [ ] `npm run verify:builder-v2:browser` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- The primitive starts needing knowledge of the quick-lineup state machine.
- Preserving the existing classes requires a confusing class-name translation
  layer.
- Extraction changes control sizes, row wrapping, or visible layout.
- Browser smoke reports mobile overflow or missing mobile picker behavior.
- This plan starts overlapping plan 012's picker target-resolution work.

## Maintenance notes

Future mobile quick-lineup polish should add target variants here instead of
copying button branches. Reviewers should reject a broad generic button that
mixes overview art cards, gear cells, and bottom-panel targets if it makes the
mobile layout harder to reason about.
