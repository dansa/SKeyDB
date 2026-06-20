# Plan 007: Window Builder V2 Picker Result Grids

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/features/builder-v2/BuilderV2AwakenerPicker.tsx src/features/builder-v2/builder-v2.css src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-dnd.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **State**: DONE
- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/003-add-builder-v2-browser-smoke-verification.md` recommended
- **Category**: perf
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

The Builder V2 picker renders every result in the active category. That means
each search/filter/tab change mounts a full grid of buttons, images, detail
controls, memo comparators, and DnD registrations. This is acceptable at small
data sizes, but it becomes a scaling tax as more wheels, awakeners, and content
arrive. Windowing the biggest categories gives performance headroom before the
next content expansion.

## Current State

Relevant files:

- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx` - shared picker and tile
  rendering.
- `src/features/builder-v2/builder-v2.css` - picker grid sizing and scroll
  containers.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - picker interaction tests.
- `src/features/builder-v2/builder-v2-dnd.test.ts` - DnD target semantics.

Current excerpts:

```tsx
// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:345
{picker.tab === 'awakeners'
  ? picker.awakeners.map((awakener) => (
      <BuilderV2AwakenerPickerTile
```

```tsx
// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:357
{picker.tab === 'wheels'
  ? picker.wheels.map((wheel) => (
      <BuilderV2WheelPickerTile
```

```tsx
// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:1208
if (isDndEnabled && dndData) {
  return (
    <DraggablePickerTileButton dndData={dndData} dndId={dndId} {...buttonProps}>
```

```tsx
// src/features/builder-v2/BuilderV2AwakenerPicker.tsx:1264
{src ? (
  <img
    alt={alt}
    ...
    loading='lazy'
```

Constraints:

- DnD hit testing depends on mounted draggable geometry.
- Keyboard and focus behavior must remain predictable.
- Do not add a virtualization dependency without an explicit dependency review
  and Socket Firewall install.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Picker/page tests | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| DnD tests | `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run` | all tests pass |
| Browser smoke if available | `npm run verify:builder-v2:browser` | exit 0 |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
- `src/features/builder-v2/builder-v2.css`
- `src/features/builder-v2/BuilderV2Page.test.tsx`

**Out of scope**:

- Adding a virtualization dependency.
- Rewriting picker filters/sorts.
- Changing item ordering.
- Changing DnD action semantics.
- Virtualizing every category in one pass if awakeners and wheels are enough.

## Git Workflow

- Branch: `codex/007-builder-v2-picker-windowing`.
- Commit message example: `perf: window builder v2 picker results`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Add a local windowing helper

Implement a small local hook/component in `BuilderV2AwakenerPicker.tsx` or a new
nearby module such as `builder-v2-picker-windowing.tsx`. It should:

- Take item count, estimated row height, column count or container width, and
  scroll offset.
- Render a buffered visible slice.
- Preserve total scroll height with spacer elements.
- Use deterministic keys from item IDs.

Keep it dependency-free.

**Verify**:
`npx tsc -p tsconfig.app.json --noEmit` passes.

### Step 2: Apply windowing to awakeners and wheels first

Use the helper for the two largest/most image-heavy tabs:

- awakeners
- wheels

Leave covenants and posses unwindowed unless the helper is trivial to reuse
without risk. Do not change sort/filter output; only change rendering.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

### Step 3: Preserve DnD and focus behavior

For DnD-enabled desktop/adaptive:

- Ensure visible tiles remain draggable.
- Ensure dragging from a visible tile still creates the expected overlay.
- Ensure scrolling does not leave stale active drop state.

For keyboard/click:

- Ensure tabbing reaches visible picker options.
- Ensure search/filter changes reset or clamp scroll if needed so users are not
  left in an empty visible window.

**Verify**:
Run `npm run verify:builder-v2:browser` if available. If not available, record
manual checks for desktop and adaptive picker DnD/click assignment.

### Step 4: Add targeted tests

Add tests that prove:

- A known result below the initial window appears after scrolling or after a
  search that narrows the list.
- Assignment still works for a visible windowed result.
- Empty/no-result states still render correctly.

Do not assert exact internal slice indexes unless the implementation makes that
part of the contract.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.

## Test Plan

- Builder V2 page tests for search/filter/window behavior.
- Browser smoke/manual DnD check for desktop/adaptive picker.
- Existing DnD pure tests to guard action semantics.

## Done Criteria

- [x] Awakeners and wheels no longer render every result at once when the result
      count exceeds the window threshold.
- [x] Search/filter/tab changes do not strand the scroll position.
- [x] Click assignment and visible-tile DnD still work.
- [x] `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-dnd.test.ts --run` passes.
- [x] Browser smoke/manual DnD evidence is recorded.
- [x] `npx tsc -p tsconfig.app.json --noEmit` and `npm run lint` pass.

## STOP Conditions

Stop and report if:

- Windowing breaks dnd-kit geometry in a way that requires a different DnD
  architecture.
- The picker grid has variable heights that make simple local windowing
  unreliable.
- A dependency seems necessary. Do not add one in this plan.

## Maintenance Notes

If future picker tabs grow, reuse the local windowing boundary after confirming
focus and DnD behavior. Reviewers should check scroll behavior after search,
filter, and tab changes.
