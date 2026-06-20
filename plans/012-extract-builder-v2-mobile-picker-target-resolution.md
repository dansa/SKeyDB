# Plan 012: Extract Builder V2 Mobile Picker Target Resolution

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat bbf19359..HEAD -- src/features/builder-v2/BuilderV2MobileLayout.tsx src/features/builder-v2/BuilderV2Page.test.tsx scripts/verify-builder-v2-browser.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S-M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `bbf19359`, 2026-06-21

## Why this matters

Mobile Builder V2 has several ways to open or retarget the picker: active slot
cards, active wheel/covenant buttons, team-management previews, posse target,
and the already-open picker target panel. These paths repeat active-team
switching, empty-slot fallback, tab selection, title construction, selected
target checks, and focus restoration. A small resolver makes future tablet and
mobile work safer without moving transient dialog state into the model.

## Current state

Relevant files:

- `src/features/builder-v2/BuilderV2MobileLayout.tsx` - owns mobile picker
  dialog state, focus restoration, and repeated target selection paths.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - existing mobile picker and
  quick-lineup behavior coverage.
- `scripts/verify-builder-v2-browser.mjs` - browser smoke that opens the mobile
  picker and checks overflow.

Current excerpts:

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:39
interface MobileOpenPickerConfig {
  isTargetSelected?: boolean
  restoreTarget?: HTMLElement | null
  selectTarget: () => void
  slotId: string | null
  tab: BuilderV2PickerTab
  title: string
}
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:86
const openPicker = useCallback(
  ({
    isTargetSelected = false,
    restoreTarget,
    slotId,
    tab,
    title,
    selectTarget,
  }: MobileOpenPickerConfig) => {
    pickerTriggerRef.current = restoreTarget ?? getCurrentFocusRestoreTarget()
    if (!isTargetSelected) {
      selectTarget()
    }
    setPickerTab(tab)
    setMobilePicker({title, tab, slotId})
  },
  [setPickerTab],
)
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:270
const updateSlotPickerTarget = useCallback(
  (slot: BuilderV2SlotView, tab: BuilderV2PickerTab, targetLabel: string) => {
    model.setPickerTab(tab)
    onUpdateMobilePickerTarget(
      slot.slotId,
      tab,
      getMobileSlotPickerTitle(model.activeTeamName, slot.slotLabel, targetLabel),
    )
  },
  [model, onUpdateMobilePickerTarget],
)
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:297
const selectSlotWheelTarget = useCallback(
  (slotId: string, wheelIndex: WheelSlotIndex) => {
    const slot = model.slots.find((candidate) => candidate.slotId === slotId)
    if (!slot) {
      return
    }

    if (slot.isEmpty) {
      const isAwakenerTargetSelected =
        model.activeSelection?.kind === 'awakener' && model.activeSelection.slotId === slotId
      if (!isAwakenerTargetSelected) {
        model.selectAwakenerSlot(slotId)
      }
      updateSlotPickerTarget(slot, 'awakeners', 'Awakener')
      return
    }
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:1084
onSelectPosse={() => {
  onOpenPicker({
    isTargetSelected: model.activeTeamTarget?.kind === 'posse',
    restoreTarget: getCurrentFocusRestoreTarget(),
    selectTarget: model.selectPosse,
    slotId: null,
    tab: 'posses',
    title: `${model.activeTeamName} · Posse`,
  })
}}
```

```tsx
// src/features/builder-v2/BuilderV2MobileLayout.tsx:1142
onSelectWheelSlot={(slotId, wheelIndex, restoreTarget) => {
  const slot = getSlotView(slotId)
  const shouldSelectAwakenerFirst = Boolean(slot?.isEmpty)
  const targetTab: BuilderV2PickerTab = shouldSelectAwakenerFirst ? 'awakeners' : 'wheels'
```

```tsx
// src/features/builder-v2/BuilderV2Page.test.tsx:1575
it('opens the awakener picker when an empty mobile gear slot is tapped', () => {
```

```js
// scripts/verify-builder-v2-browser.mjs:125
const firstSlot = page.getByRole('button', {name: 'Select Slot 1'}).first()
await assertVisible(firstSlot, 'mobile picker trigger')
await firstSlot.click()
await assertVisible(page.getByRole('dialog', {name: /Awakener/i}), 'mobile picker dialog')
await page.keyboard.press('Escape')
```

Repo conventions to follow:

- `useBuilderV2Model.ts` owns domain picker search/tab state; mobile layout owns
  transient dialog and focus restoration state. Keep that split.
- `useStableEvent` is used where stable callbacks prevent stale closure churn;
  use it only if the extracted helper needs stable event semantics.
- Tests should assert behavior by roles/names, not CSS classes or snapshots.

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
- New local helper file under `src/features/builder-v2/` only if it stays mobile
  specific, for example `builder-v2-mobile-picker-targets.ts`
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Moving mobile dialog state or focus refs into `useBuilderV2Model.ts`
- Changing adaptive layout picker behavior
- Changing picker tab labels, visible titles, or route behavior
- Changing quick-lineup state machine logic in the builder store
- CSS/layout changes

## Git workflow

- Branch: `codex/012-builder-v2-mobile-picker-targets`
- Commit message example: `refactor: extract builder v2 mobile picker target resolution`
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Add characterization for focus and retargeting gaps

Before extraction, add focused tests to `BuilderV2Page.test.tsx` if equivalent
coverage does not already exist:

- mobile click on an empty wheel/covenant target opens the awakener picker
- mobile click on a filled slot's wheel target opens the wheel picker
- closing the mobile picker with Escape restores focus to the trigger
- retargeting from the open mobile picker panel changes tab/title without
  closing the dialog

Use the existing mobile tests near `opens the awakener picker when an empty
mobile gear slot is tapped` as the structural pattern.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` exits 0.

### Step 2: Extract a pure target resolver

Create a helper that accepts the current model-like inputs and a request such as:

- `{kind: 'slot', slotId}`
- `{kind: 'wheel', slotId, wheelIndex}`
- `{kind: 'covenant', slotId}`
- `{kind: 'posse', team?: BuilderV2TeamSummary}`

The helper should return enough data for the caller to apply side effects:

- `slotId`
- `tab`
- `title`
- `isTargetSelected`
- `selectTarget`

It may be a hook if passing model callbacks as function inputs becomes awkward,
but it must not own `setMobilePicker`, `pickerTriggerRef`, or `closePicker`.

**Verify**:
`npx tsc -p tsconfig.app.json --noEmit` exits 0.

### Step 3: Route initial open callers through the resolver

Update these mobile paths to ask the resolver for config:

- `BuilderV2ActiveHeader` posse open path
- `BuilderV2TeamSlots` `onSelectSlot`
- `BuilderV2TeamSlots` `onSelectWheelSlot`
- `BuilderV2TeamSlots` `onSelectCovenantSlot`
- `BuilderV2TeamManagement` mobile slot and posse edit shortcuts

Preserve focus restoration by passing the original `restoreTarget` through
`openPicker` unchanged.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` exits 0.

### Step 4: Route in-dialog retargeting through the same resolver

Update `MobilePickerDialog` target panel handlers so awakener, wheel, and
covenant retargeting use the same empty-slot fallback and title/tab logic as
initial opening.

Keep `onUpdateMobilePickerTarget` as the dialog-state update mechanism; the
resolver should provide what to update, not perform the update itself.

**Verify**:
`npm run test:integration:builder-v2` exits 0.

### Step 5: Browser-check the mobile picker path

Run:

```text
npm run verify:builder-v2:browser
```

This gate opens the mobile picker, checks the dialog appears, closes it with
Escape, checks horizontal overflow, and checks desktop/adaptive surfaces.

**Verify**:
The command exits 0.

## Test plan

- Add or keep page-level tests for mobile target opening and focus restoration.
- Do not add CSS class snapshots.
- Do not assert exact internal resolver object shape except in a small pure
  helper test if the helper is extracted to a separate module.

## Done criteria

- [ ] Initial mobile picker open paths and in-dialog retarget paths share one
      target-resolution helper/hook.
- [ ] Mobile dialog lifecycle state remains in `BuilderV2MobileLayout.tsx`.
- [ ] Empty wheel/covenant targets still open the awakener picker.
- [ ] Picker close still restores focus to the trigger.
- [ ] `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` exits 0.
- [ ] `npm run test:integration:builder-v2` exits 0.
- [ ] `npm run verify:builder-v2:browser` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- The helper needs to own mobile dialog state or focus refs.
- The helper needs changes to `useBuilderV2Model.ts`.
- Existing title strings or accessible names would need to change.
- Focus restoration becomes flaky in tests or browser smoke.
- The change expands into adaptive picker behavior.

## Maintenance notes

Future mobile and tablet picker work should add new target kinds to this helper
instead of copying `isTargetSelected`, `selectTarget`, tab, and title logic into
new click handlers. Reviewers should compare initial open and in-dialog
retargeting behavior, because that is the drift this plan removes.
