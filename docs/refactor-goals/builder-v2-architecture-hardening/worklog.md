# Refactor Goal Worklog: builder-v2-architecture-hardening

## Entries

### 2026-05-22 - Goal packet created

- Source: User explicitly requested `$refactor-discipline:refactor-goal-prep` for Builder V2 architecture hardening after the `1ab19b79` Builder V2 baseline commit.
- Intake: Equivalent intake supplied by user and prior Builder V2 goal. Scope is Builder V2 internals/code health, not mobile redesign, teams-list shape, or DnD implementation. Preserve current `/builder-v2` and `/builder` behavior.
- Scout agents:
  - TypeScript scout mapped broad selection/wheel index invalid states, editing-mode drift, and persistence envelope parsing.
  - React scout mapped the god hook, picker query coupling, render DTO slot shape, manual memo comparators, and adaptive callback churn.
  - Tailwind/CSS scout mapped duplicated rail/button styles, focus/motion drift, clipping risks, picker grid sizing, and repeated button contracts.
  - UI/a11y scout mapped duplicate picker IDs, incomplete picker tile accessible names, adaptive drawer focus issues, reduced-motion gaps, destructive clear controls, and picker grid overflow risk.
  - Complexity/rootfix scout mapped `useBuilderV2Model.ts` as the main root-fix target, assignment pipeline duplication, explicit team-state result needs, UI-local assignment outcome inference, and layout duplication pressure.
- Local commands:
  - Read `package.json`.
  - Measured current Builder V2 file sizes: `useBuilderV2Model.ts` 2162 lines, `BuilderV2AwakenerPicker.tsx` 842, `BuilderV2TeamSlots.tsx` 399, `BuilderV2AdaptiveLayout.tsx` 406, `builder-v2.css` 2492.
  - Ran refactor-discipline complexity scanner with `--json`.
  - Ran refactor-discipline performance-pattern scanner with `--ts-only --json`.
- Active task: `J1` choose the first hardening Worker slice. Likely route is C1 characterization first, then C2 loadout command resolver, unless Judge proves a safe combined slice.
- Validation: No product code changed during S1. Goal checker to run after packet creation.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - J1 selected first Worker slice

- Cleanup before continuing: removed disposable untracked top-level `builder-v2-*.png` screenshots and `docs/design/oracle-sendoff.md`; kept durable mockup images under `docs/design/` untracked for future design reference.
- Judge decision: selected `C1` Assignment behavior characterization as the first Worker slice.
- Root-fix reasoning: `C2` loadout command extraction is the right architectural direction, but assignment behavior is high-risk because it includes duplicate/transfer paths, same-team wheel swaps, cross-team transfers, covenant/noop handling, posse transfer, quick-lineup advancement, picker closing, and selection restoration. Characterization lands first so the command boundary can be refactored against current behavior.
- Rejected combined first slice: combining `C1` and `C2` immediately would mix test discovery with production refactor work in the most branch-heavy Builder V2 paths.
- Active task: `W1` Characterize Builder V2 assignment outcomes.
- W1 allowed files: `src/features/builder-v2/useBuilderV2Model.test.ts`, `src/features/builder-v2/BuilderV2Page.test.tsx`, `src/features/builder-v2/builder-v2-test-mocks.ts`, and this goal packet.
- W1 protected scope: no product source changes, no mobile redesign, no teams-list shape decisions, no DnD implementation, no dependency changes, no `docs/design/**` changes.
- W1 validation target: focused Builder V2 Vitest suites, with `tsc`/targeted eslint if helper/type changes require them.
- Packet validation: `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-architecture-hardening` returned OK.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - W1/W2 architecture tranche landed

- Native Codex goal created after user noted the workflow expectation: complete a multi-slice Builder V2 architecture-hardening tranche for W1/W2, use subagents, update the packet, verify, and commit local chunks without protected scope drift.
- W1 implemented C1 Assignment behavior characterization in `src/features/builder-v2/useBuilderV2Model.test.ts`.
  - Added helper `createAssignedSlot`.
  - Pinned active-team wheel swaps and target focus.
  - Pinned support-slot cross-team wheel behavior.
  - Pinned active-team covenant swaps and target focus.
  - Pinned wheel/covenant assignment violations.
  - Pinned awakener assignment violation behavior so the current picker tab is preserved.
- J2 selected C2 as the implementation slice after W1 because the characterization net covered the fragile assignment semantics.
- W2 implemented C2 Builder V2 loadout command resolver.
  - Added `src/features/builder-v2/builder-v2-loadout-commands.ts`.
  - `useBuilderV2Model.ts` now delegates awakener/wheel/covenant/posse assignment resolution to pure command resolvers and applies the resolved outcome in one hook callback.
  - Moved wheel target resolution, covenant slot target resolution, cross-team awakener ownership resolution, assignment violation mapping, and loadout transfer/no-op decisions out of the hook.
  - Self-review caught and fixed one behavior drift: awakener assignment violations do not retarget the picker tab.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-usage-index.test.ts --run` passed with 68 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder-v2/useBuilderV2Model.ts src/features/builder-v2/builder-v2-loadout-commands.ts src/features/builder-v2/useBuilderV2Model.test.ts` passed.
- Subagents:
  - Reviewer `019e5197-3a05-74e0-be61-2bdcbdf19479` returned `pass-with-followups`: no code behavior findings; packet was stale and needed this update.
  - Scout `019e5197-6d6e-7761-b095-a33c4b837178` recommended C3 next, then C6; C7/C9/C10/CSS candidates remain queued but lower priority for the immediate architecture sequence.
  - Both completed subagents were closed after their results were recorded.
- J3 active: choose next post-command-boundary Worker slice. Current recommendation is C3 selection/editing-mode boundary before C6 picker query modules.
- Packet validation: `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-architecture-hardening` returned OK.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - W3 editing-target boundary

- J3 selected C3 V2 selection/editing-mode boundary as the next Worker slice.
- C3 scout `019e51a3-9af8-7d40-9ae1-d1a14a87e4d8` confirmed scope: local V2 helper only; no shared `ActiveSelection`/`WheelSlotIndex`, no mobile/adaptive redesign, no DnD, no CSS.
- C6 scout `019e51a3-c94c-70e3-b9d6-007bdc67b028` mapped the next picker-query extraction after C3 and recommended `builder-v2-picker-options.ts` with pure helper tests.
- Both scouts completed and were closed after their results were recorded.
- W3 implementation:
  - Added `src/features/builder-v2/builder-v2-editing-mode.ts`.
  - Added `src/features/builder-v2/builder-v2-editing-mode.test.ts`.
  - Routed quick-lineup focus sync, team/import clearing, slot/posse selection, loadout command application, transfer-confirm focus, and clear actions through the editing-target boundary or its toggle helper.
  - Added model tests for coupled slot/posse selection, same-batch toggle semantics, and explicit loadout picker-tab preservation while an awakener slot remains active.
- Review:
  - Reviewer `019e51a7-f48e-73b1-9357-4d02f5e00231` found explicit picker-tab override drift, same-batch toggle drift, and packet allowed-file drift.
  - Fixed explicit `pickerTabOverride` handling, restored functional toggle semantics, and added the helper test file to W3 allowed files.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-editing-mode.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-usage-index.test.ts --run` passed with 76 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed after reviewer fixes.
  - `npx eslint src/features/builder-v2/useBuilderV2Model.ts src/features/builder-v2/builder-v2-editing-mode.ts src/features/builder-v2/builder-v2-editing-mode.test.ts src/features/builder-v2/useBuilderV2Model.test.ts` passed after reviewer fixes.
  - `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-architecture-hardening` returned OK.
- J4 active: choose C6 pure picker option query module slice.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - J4 selected picker-query extraction

- User requested the same loop continue with a bigger multi-tranche chunk.
- J4 selected `C6` Pure picker option query modules as W4.
- Root-fix reasoning: W1-W3 moved loadout/editing semantics out of `useBuilderV2Model.ts`, but the hook still owns the four picker option pipelines plus sorting, recommendation, ownership-sinking, and status-label helpers. Extracting those into a pure module is a direct architecture slice that supports future picker/drag work without changing the picker UI.
- W4 active: `Extract pure Builder V2 picker option queries`.
- W4 allowed files: `src/features/builder-v2/useBuilderV2Model.ts`, new `src/features/builder-v2/builder-v2-picker-options.ts`, new focused picker option tests, `BuilderV2ModelTypes.ts` only if needed, `useBuilderV2Model.test.ts` only for behavior coverage, and this goal packet.
- W4 protected scope: no picker redesign/chrome, no mobile/tablet layout changes, no teams-list shape work, no DnD implementation, no CSS polish, no dependency/state-library change, no shared `/builder` runtime changes, and no `docs/design/**`.
- W4 validation target: focused picker/model/page tests, app typecheck, targeted eslint, and the packet checker.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - W4 picker-query extraction landed

- W4 implementation:
  - Added `src/features/builder-v2/builder-v2-picker-options.ts`.
  - Moved Builder V2 awakener, wheel, covenant, and posse picker option construction into pure local functions.
  - Kept the React `useMemo` gates in `useBuilderV2Model.ts` so inactive picker tabs still return empty arrays.
  - Removed picker sorting/recommendation/status-label helper logic from `useBuilderV2Model.ts`.
  - Added `src/features/builder-v2/builder-v2-picker-options.test.ts` for direct pure option coverage.
- Subagents:
  - Scout `019e51b3-1755-7e32-8959-b8480fec56b9` mapped extraction invariants: inactive-tab empties, awakeners search relevance before collection sort, entity-specific ownership filtering/sinking, exact status labels, and wheel/covenant recommendation labels.
  - Reviewer `019e51b9-b735-77b2-8b8c-f85f8339af43` found no scoped code regressions. It noted untracked `docs/design/` images as a possible scope concern; controller kept those pre-existing untracked reference images out of W4 staging.
  - Both completed subagents were closed after their results were recorded.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-picker-options.test.ts src/features/builder-v2/builder-v2-editing-mode.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-usage-index.test.ts --run` passed with 80 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder-v2/useBuilderV2Model.ts src/features/builder-v2/builder-v2-picker-options.ts src/features/builder-v2/builder-v2-picker-options.test.ts` passed.
  - `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-architecture-hardening` returned OK.
- R3 complete: W4 review recorded.
- J5 active: choose the next contained post-picker-extraction slice. Candidate options are likely C9 shared picker a11y hardening, C10 adaptive focus, C7 callback churn, or a small CSS contract slice if Judge can keep it contained.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - J5 selected shared picker a11y hardening

- J5 selected `C9` Shared picker a11y hardening as W5.
- Root-fix reasoning: after W4, picker option DTOs and status metadata are stable in one pure module. The shared picker content still uses fixed tab/panel IDs and tile accessible names omit several existing chip/status states, which is a semantic defect across picker shells.
- Rejected C10/C11/C12 for this tranche: adaptive focus and CSS contracts are valid queued candidates but more likely to drift into layout or visual polish. W5 should be semantic-only and shared.
- W5 active: `Harden shared picker ids and tile accessible names`.
- W5 allowed files: `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`, `src/features/builder-v2/BuilderV2Page.test.tsx`, and this goal packet.
- W5 protected scope: no CSS, no adaptive/mobile layout files, no model/option DTO behavior, no picker redesign, no teams-list, no DnD, no dependency changes, no `docs/design/**`.
- W5 validation target: focused page/model picker tests, app typecheck, targeted eslint, and packet checker.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-22 - W5 shared picker a11y hardening landed

- W5 implementation:
  - Updated `BuilderV2PickerContent` to use instance-safe picker tab/panel IDs.
  - Kept tab `aria-controls`, tabpanel `aria-labelledby`, and keyboard roving focus scoped to the same picker instance.
  - Expanded picker tile accessible names with existing visible status metadata: level/enlighten, unowned, in-use team, blocked reason, recommendation tier/mainstat, active posse, and posse ownership state.
  - Added `BuilderV2Page.test.tsx` coverage for picker-owned IDs, tab/panel wiring, roving focus, and richer tile accessible names.
- Review:
  - Reviewer `019e51c3-9a6c-7bb2-a200-05aac9b2dd6a` found three issues: ambiguous raw `Team N` accessible labels, duplicated `Unowned` for posses, and an overbroad page-wide ID uniqueness assertion.
  - Fixed labels to say `In use by Team N`, deduplicated posse accessible status text, and narrowed the ID assertion to picker-owned IDs.
  - Reviewer completed and was closed after its result was recorded.
- Validation:
  - `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-picker-options.test.ts src/features/builder-v2/useBuilderV2Model.test.ts --run` passed with 75 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder-v2/BuilderV2AwakenerPicker.tsx src/features/builder-v2/BuilderV2Page.test.tsx` passed.
- J6 active: choose the next architecture-hardening tranche after W5 is committed.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - J6 selected adaptive focus hardening

- User requested the same multi-tranche loop continue.
- Native Codex goal created for another larger Builder V2 architecture-hardening run.
- Scouts:
  - C7 scout `019e51c9-87e5-7143-848d-0e525ed5e2bc` confirmed adaptive callback churn remains useful but is a broader React/model API tranche.
  - C10 scout `019e51c9-b550-7580-85d4-d900cb5a4214` confirmed adaptive picker focus restore/containment is contained to `BuilderV2AdaptiveLayout.tsx` and `BuilderV2Page.test.tsx`.
  - C4/C5 scout `019e51c9-e312-7b22-a85a-ab0792143025` recommended additive C5 later but warned it touches shared `/builder` and V1 quick-lineup semantics; C4 should remain type-only if selected later.
- J6 selected `C10` Adaptive drawer focus containment/restore as W6.
- Root-fix reasoning: C10 is small, testable, and improves semantic quality without touching drawer shape/layout. C7 remains a likely next tranche if W6 lands cleanly; C5 is queued but too shared/V1-wide for this first tranche.
- W6 active: `Harden adaptive picker focus restore and containment`.
- W6 allowed files: `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`, `src/features/builder-v2/BuilderV2Page.test.tsx`, and this goal packet.
- W6 protected scope: no mobile layout, no CSS, no model changes, no drawer shape/layout redesign, no teams-list, no DnD, no dependency changes, no `docs/design/**`.
- W6 validation target: focused Builder V2 page tests, app typecheck, targeted eslint, and packet checker.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - W6 adaptive focus hardening landed

- W6 implementation:
  - Updated adaptive picker open paths to remember the current focus restore target for footer, slot, wheel, covenant, and posse entry points.
  - Preserved successful assignment close behavior by keeping `closePicker(false)` on picker assignment paths.
  - Moved Tab containment into the active document keydown listener so focus recovery works even when focus has drifted outside the dialog.
  - Added page tests for stale opener prevention, slot-trigger Escape restore, Tab/Shift+Tab wrapping, and outside-focus Tab recovery.
- Review:
  - Reviewer `019e51ce-f48a-75a0-8099-2634b53dc866` found the first outside-focus recovery implementation was not actually enforced because Tab handling lived on dialog `onKeyDown` only.
  - Fixed by handling Tab in the document keydown listener while the adaptive picker is open and by dispatching the regression test from the focused outside element.
  - Reviewer also noted untracked `docs/design/` images as a possible package risk; they remain pre-existing untracked references and were not changed or staged.
- Validation:
  - `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` passed with 35 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder-v2/BuilderV2AdaptiveLayout.tsx src/features/builder-v2/BuilderV2Page.test.tsx` passed.
- R5 complete: W6 review recorded.
- J7 active: choose the next post-focus-hardening tranche. Current recommendation is C7 adaptive callback/action churn if it can stay Builder V2-only; C5 remains queued for a later shared `/builder` tranche with extra characterization.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`
