# Plan 021: Reduce Builder V2 Stable-Event Boundaries

> **Executor instructions**: Read this plan fully before editing. Treat callback
> identity as an explicit consumer contract, not a blanket optimization. Update
> tests before removing the final `useStableEvent` implementation, and stop at
> any boundary whose identity requirements cannot be demonstrated.
>
> **Drift check**:
> `git diff --stat 5032ca7f..HEAD -- src/features/builder-v2`

## Status

- **Status**: IMPLEMENTED
- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: maintainability/performance
- **Planned at**: commit `5032ca7f`, 2026-07-19

## Why This Matters

`useStableEvent` currently gives Builder V2 callbacks a stable identity while
dispatching to the latest committed handler. Its behavior is tested and valid,
but many call sites wrap model commands that are already stabilized with
`useCallback`. Other call sites use it preemptively for ordinary React event
props without evidence that a memoized child or retained third-party callback
requires stable identity.

This makes callback ownership harder to read, hides reactive dependencies in
composite picker commands, and requires narrow React Doctor suppressions because
the analyzer cannot model the custom stable-latest callback contract.

The goal is not to replace the hook with another universal wrapper. The goal is
to make each callback boundary explicit and delete `useStableEvent` if no true
stable-latest integration boundary remains.

## Current Evidence

- `useBuilderV2Model.ts` already creates core commands such as
  `assignAwakener` and `startQuickLineup` with `useCallback`.
- `BuilderV2Page.tsx` and `BuilderV2MobileLayout.tsx` wrap several of those model
  commands again with `useStableEvent`.
- `BuilderV2AwakenerPicker.tsx` wraps incoming callback props before forwarding
  or invoking them.
- `BuilderV2AdaptiveLayout.tsx` uses `useStableEvent` for composite picker,
  focus-return, selection, and assignment operations that capture local state.
- `useStableEvent.test.tsx` proves the current contract: one callback identity
  invokes the latest committed handler after rerender.
- React's `useEffectEvent` is not a replacement: Effect Events may only be
  called from Effects and must not be passed to children.

## Target Callback Policy

Use the narrowest mechanism that matches the consumer:

1. **Ordinary React/DOM event handler**: use a local function. Do not stabilize
   it solely to avoid allocation.
2. **Already-stable model command**: pass the command directly. Do not wrap it.
3. **Function prop passed to a memoized child where identity affects an
   measured render path**: use `useCallback` with complete explicit
   dependencies.
4. **Function used as a Hook dependency**: use `useCallback`, or restructure the
   Hook so its primitive dependencies are explicit.
5. **External API that retains a callback while requiring the latest committed
   implementation**: keep a stable-latest adapter only after documenting and
   testing that external identity contract.

Do not use `useEffectEvent` for callbacks passed to children, DnD handlers, or
ordinary user interactions.

## Implemented Callback Inventory

Reviewed against commit `6cc20a42` and the follow-up review fixes:

| Boundary | Consumer contract | Implementation |
| --- | --- | --- |
| Page and adaptive assignment commands | Already-stable model commands forwarded to picker components | Passed directly |
| Page detail-opening commands | Props of memoized picker/layout children; no reactive inputs | `useCallback([])` |
| Desktop/adaptive team-list slot and posse selection | Props of memoized team-management children; reads current selection state | `useCallback` with explicit primitive state and stable commands; shared selection semantics live in `builder-v2-editing-mode.ts` |
| Adaptive picker open, close, selection, and focus restoration | Child props; `closePicker` is also an Effect dependency | `useCallback` with explicit state, ref, and command dependencies |
| Mobile picker, assignment, quick-lineup, and detail commands | Props of memoized mobile/picker children | `useCallback` with explicit command and local-state dependencies |
| Picker tile callbacks | Ordinary forwarding to descendants whose other item props are reconstructed | Incoming callbacks invoked directly |
| Team-action toast callback | React-rendered dialog callback; not retained outside the current render | Normal reactive dependency; the test proves rerender replaces the callback and the current callback uses the latest handler |
| DnDKit and browser APIs | No `useStableEvent` callback was passed to or retained by these APIs | No stable-latest adapter required |

No production boundary requires stable identity while dispatching to a newer
implementation. `useStableEvent` and its contract test were therefore deleted.

The full unsuppressed scan also exposed the adjacent `ResizeObserver` callback
ref in `BuilderV2TeamManagement.tsx`. Its React 19 disposer was valid, but the
observer lifecycle is now expressed as a conventional Effect with explicit
cleanup so the contract is visible to both readers and static analysis.

## Scope

**In scope**:

- `src/features/builder-v2/useStableEvent.ts`
- `src/features/builder-v2/useStableEvent.test.tsx`
- `src/features/builder-v2/BuilderV2Page.tsx`
- `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
- `src/features/builder-v2/BuilderV2MobileLayout.tsx`
- `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
- `src/features/builder-v2/useBuilderV2Model.ts`
- Focused Builder V2 tests and browser verification

**Out of scope**:

- Builder V1/classic Builder.
- Product behavior, layout, styling, or DnD semantics.
- Removing `memo()` without profiler evidence.
- Replacing every event handler with `useCallback`.
- Introducing a new general-purpose callback utility.

## Steps

### Step 1: Inventory identity-sensitive consumers

For every `useStableEvent` call, record which of these applies:

- passed to a component wrapped in `memo()`;
- included in a Hook dependency array;
- retained by DnDKit, a subscription, observer, timer, or browser API;
- ordinary event callback with no identity-sensitive consumer.

Remove wrappers from the fourth category first. If the consumer is memoized,
confirm that its other props are stable enough for callback identity to matter;
otherwise the wrapper provides no render benefit.

### Step 2: Remove redundant model-command wrappers

Start with model commands already created by `useCallback`:

- assignment commands in `BuilderV2Page.tsx`;
- picker-tab, quick-lineup, and assignment commands in
  `BuilderV2MobileLayout.tsx`;
- any equivalent direct command forwarding in picker components.

Pass those functions directly and run focused tests after each file. Do not
change the public `BuilderV2Model` shape solely for this cleanup.

### Step 3: Make composite picker dependencies explicit

Move Adaptive Layout picker orchestration into a focused local hook, expected
name `useBuilderV2PickerController`, if that reduces dependency repetition.
Create composite callbacks with `useCallback` and complete dependency arrays.
Prefer primitive state and stable model commands over depending on the entire
`model` object.

The extracted controller may own:

- picker expansion and focus-return commands;
- slot/posse selection followed by picker opening;
- assignment followed by picker cleanup;
- team-list selection followed by picker opening.

Do not move domain selection state out of `useBuilderV2Model`; the controller
owns only adaptive-layout orchestration.

### Step 4: Reassess picker prop wrappers

In `BuilderV2AwakenerPicker.tsx`, invoke incoming callback props directly unless
their stable identity is required by a memoized descendant or retained API.
Use `useCallback` only at the exact identity-sensitive boundary, with the prop
in its dependency array.

### Step 5: Decide the hook's disposition

After the previous steps:

- If no production call sites remain, delete `useStableEvent.ts`, its test, and
  all associated React Doctor suppressions.
- If a retained external boundary remains, keep the hook but rename it to match
  that boundary, document why stable-latest semantics are required, and keep a
  focused integration test proving both stable identity and latest behavior.

## Verification

Run after each tranche:

- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run test:integration:builder-v2`

Run before completion:

- `npm exec react-doctor -- --json --yes`
- `npm exec react-doctor -- --json --yes --no-respect-inline-disables`
- `npm run verify:builder-v2:browser`
- `npm run verify`
- `git diff --check`

Behavioral checks:

- picker open/close and focus return work in adaptive layout;
- assignment commands always use the latest active team, slot, and picker
  target after rerender;
- quick-lineup transitions remain correct on mobile;
- DnD behavior and collision semantics remain unchanged;
- React DevTools Profiler shows no material regression in memoized Builder V2
  child renders.

### Verification record — 2026-07-22

- `npx tsc -p tsconfig.app.json --noEmit`: passed.
- `npm run lint` and `npm run format:check`: passed.
- `npm run test:integration:builder-v2`: 3 files, 172 tests passed.
- Focused editing-mode tests: 7 files, 50 tests passed.
- `npm exec react-doctor -- --json --yes --scope changed`: zero diagnostics.
- Full unsuppressed React Doctor scan: Builder V2 clean; only the pre-existing
  Builder V1 `no-giant-component` warning remains.
- `npm run verify`: 242 files and 1,787 tests passed, with script tests, asset
  validation, typecheck, and production build also passing.
- Interactive Chrome verification at 1365x900, 900x900, and 390x844: desktop,
  adaptive, and mobile surfaces rendered without horizontal overflow; adaptive
  collapse and mobile Escape restored focus to their initiating slot controls;
  mobile quick lineup advanced from Awakener to Wheel 1 after assigning the
  current Slot 1 target; no console errors were recorded.
- The repository Playwright smoke was attempted after installing its current
  Chromium runtime, but its desktop wheel DnD fixture could not find an owned
  wheel in the fresh browser profile. The equivalent responsive and interaction
  checks above were completed in Chrome; this is a fixture limitation, not a
  Builder V2 runtime failure.

## Done Criteria

- [x] Every remaining stabilized callback has an identified identity-sensitive
      consumer.
- [x] Already-stable model commands are passed directly.
- [x] Composite callbacks expose complete reactive dependencies.
- [x] Ordinary event handlers no longer use stable-latest wrapping by default.
- [x] `useStableEvent` is deleted, or its remaining external contract is named,
      documented, and integration-tested.
- [x] React Doctor full scan has no unsuppressed Builder V2 diagnostics.
- [x] Builder V2 focused, interactive browser, and full repository gates pass.

## STOP Conditions

Stop and report instead of improvising if:

- DnDKit or another dependency retains a callback but its identity contract
  cannot be established from code, tests, or official documentation.
- Replacing a stable-latest callback introduces stale state in focus restoration,
  active selection, quick-lineup, or assignment behavior.
- The refactor requires changing Builder V2 domain semantics or public model
  shape.
- Profiler results show a meaningful render regression that cannot be isolated
  to one explicit callback boundary.
