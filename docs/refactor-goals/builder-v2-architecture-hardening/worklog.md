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

### 2026-05-23 - J7 selected adaptive callback stabilization

- J7 selected `C7` Stable action groups / adaptive callback churn as W7.
- Root-fix reasoning: desktop already had a local `useStableEvent` workaround for picker assignment handlers, while adaptive picker open/assignment callbacks still close over the whole `model`. W7 can share the stable-event helper and stabilize adaptive callbacks without changing the Builder V2 model shape.
- Rejected C5 for this tranche: scout found the additive `changed` result is valuable but touches shared `/builder` runtime, V1 quick-lineup semantics, and transfer no-op behavior. It remains queued for a later shared tranche with extra characterization.
- W7 active: `Stabilize Builder V2 adaptive picker action callbacks`.
- W7 allowed files: `BuilderV2Page.tsx`, `BuilderV2AdaptiveLayout.tsx`, new `useStableEvent.ts`, focused Builder V2 page/model tests if needed, and this goal packet.
- W7 protected scope: no mobile layout, no model shape/type changes, no CSS, no teams-list, no DnD, no dependencies, no `docs/design/**`.
- W7 validation target: focused Builder V2 page/model tests, app typecheck, targeted eslint, and packet checker.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - W7 adaptive callback stabilization landed

- W7 implementation:
  - Added shared `src/features/builder-v2/useStableEvent.ts`.
  - Removed the desktop-only local stable-event helper from `BuilderV2Page.tsx`.
  - Updated `BuilderV2AdaptiveLayout.tsx` picker open, slot/covenant/wheel/posse selection, and assignment wrappers to use stable callbacks while reading the latest model at invocation time.
- Review:
  - Reviewer `019e51d6-85d5-7480-9dbd-04c670bcc151` found one stale-window issue: the first helper version updated its ref in passive `useEffect`, allowing a fast event between commit and effect flush to call the previous handler.
  - Fixed by using `useLayoutEffect` inside `useStableEvent`.
  - Reviewer also noted untracked `docs/design/` images as a possible package risk; they remain pre-existing untracked references and were not changed or staged.
- Validation:
  - `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/useBuilderV2Model.test.ts --run` passed with 73 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/BuilderV2AdaptiveLayout.tsx src/features/builder-v2/useStableEvent.ts` passed.
- R6 complete: W7 review recorded.
- J8 active: choose the next Builder V2 hardening slice only if continuing this goal.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - J8 selected shared WheelSlotIndex boundary

- User requested the same multi-tranche loop continue.
- Native Codex goal created for another larger Builder V2 architecture-hardening run.
- Scouts:
  - CSS scout `019e51de-6ca1-7b80-9eec-823d64b03216` recommended combining C11/C14 as a CSS picker focus/motion/grid tranche and keeping C12 separate.
  - Wheel-index scout `019e51de-9929-71e2-a1f6-7053942c949e` confirmed C4 is contained if V1 protection tests and raw-number guards stay in scope.
  - Team-state scout `019e51de-c5f8-7751-9915-75308617159f` confirmed C5 is viable only as additive shared metadata and should not replace existing no-op identity checks in the same pass.
  - DnD-boundary scout `019e51de-f604-7f72-89f5-4d65a447d4c9` recommended keeping C8/C13 queued until a concrete DnD overlay/ghost contract exists.
- J8 selected `C4` Shared `WheelSlotIndex` type as W8.
- Root-fix reasoning: C4 hardens a trusted input boundary ahead of future DnD while preserving current V1/V2 behavior. C11/C14 is the next likely tranche; C5 remains queued for shared-runtime metadata; C8/C13 remain queued until real DnD work.
- W8 active: `Introduce shared WheelSlotIndex boundary`.
- W8 allowed files: shared builder wheel types/helpers and direct V1/V2 wheel-selection, card, usage-index, loadout, and model consumers plus this goal packet.
- W8 protected scope: do not change `team-state.ts` runtime semantics, mobile redesign, teams-list shape, DnD implementation, dependencies, remote state, or `docs/design/**`.

### 2026-05-23 - W8 WheelSlotIndex boundary landed

- W8 implementation:
  - Added shared `src/features/builder/wheel-slot-index.ts` helpers.
  - Introduced `WheelSlotIndex` in shared builder types for wheel usage, quick-lineup steps, active selection, predicted drop hover, and team-wheel drag payloads.
  - Updated V1 wheel card/drop/selection paths to normalize raw `number` inputs before constructing typed wheel selections or drag payloads.
  - Updated V1 wheel-action test fixtures so build-time test typechecking also uses `WheelUsageLocation`.
  - Updated Builder V2 model/types/loadout/usage/slot surfaces to use the shared `WheelSlotIndex` boundary instead of local `0 | 1` annotations or fallback clamping.
  - Kept `team-state.ts` runtime guards untouched and did not implement DnD.
- Review:
  - Reviewer `019e51e6-c12d-7501-8ee7-ae427c6cdbb3` found one packaging issue: new `wheel-slot-index.ts` was untracked while tracked files imported it.
  - Controller will explicitly stage the helper with the W8 commit and keep `docs/design/` untracked.
  - Reviewer found no behavior-regression issues in V1/V2 wheel selection, assignment, or DnD ingress normalization.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/builder-v2-usage-index.test.ts src/features/builder/useBuilderViewModel.test.ts src/features/builder/BuilderPage.quick-lineup.test.tsx --run` passed with 78 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched C4 files passed.
  - Full pre-commit build initially exposed widened numeric wheel-index fixtures in `createBuilderWheelActions.test.ts`; fixtures were corrected and validation rerun.
- R7 complete: W8 review recorded.
- J9 active: choose the next post-WheelSlotIndex hardening tranche. Current recommendation is C11/C14 CSS focus/motion/picker-grid contract.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - J9 selected CSS picker contract hardening

- J9 selected combined `C11` Builder V2 motion/focus CSS contract and `C14` Picker grid sizing contract as W9.
- Root-fix reasoning: the CSS scout recommended combining C11/C14 because both touch the same picker interaction surface in `builder-v2.css`: focus rings, reduced-motion behavior, and picker results grid sizing.
- Kept C12 separate because rail/button dedupe may require component class-name changes and should not be mixed with picker CSS contracts.
- W9 active: `Harden Builder V2 picker focus motion and grid CSS contract`.
- W9 allowed files: `src/features/builder-v2/builder-v2.css` and this goal packet.
- W9 protected scope: no component markup, mobile redesign, teams-list shape, DnD implementation, dependencies, remote state, or `docs/design/**`.

### 2026-05-23 - W9 CSS picker contract hardening landed

- W9 implementation:
  - Added Builder V2-local focus ring and picker grid sizing custom properties on `.builder-v2-page`.
  - Updated desktop/adaptive/mobile picker results to use one `auto-fill` grid column contract instead of a fixed desktop grid plus duplicated adaptive/mobile grid overrides.
  - Reused focus-ring tokens for search, picker tile, shared controls, and mobile controls.
  - Expanded reduced-motion handling inside Builder V2 to remove transition delay/duration and suppress card-art scale while preserving static hover/focus affordances.
  - Did not change component markup, mobile structure, teams-list behavior, DnD behavior, dependencies, or `docs/design/**`.
- Review:
  - Reviewer `019e51f0-69d4-77c3-a37e-5988af81d850` reported no findings.
  - Reviewer checked picker grid density, focus visibility, reduced-motion scope, protected teams/DnD/dependency areas, and CSS parse/browser compatibility.
  - Reviewer noted residual visual risk because browser screenshots were not run.
- Validation:
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Reviewer ran `npm run build:quiet` successfully.
  - Targeted `npx eslint src/features/builder-v2/builder-v2.css` is ignored by repo config because CSS is not covered by the current ESLint configuration.
- R8 complete: W9 review recorded.
- J10 active: choose the next post-CSS-contract hardening tranche only if continuing.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - W10 persistence envelope parser landed

- J10 selected `C15` Persistence envelope parser as W10.
- Root-fix reasoning: C15 is a contained TypeScript trust-boundary cleanup with focused persistence tests. It removes unsafe envelope casts without changing persistence keys, versions, migration behavior, current-over-legacy precedence, or UI surfaces.
- Packet repair:
  - Reconciled stale `state.json` candidate statuses for already-landed C6, C7, C9, and C10 to `implemented`.
- W10 implementation:
  - Added `parsePersistedBuilderEnvelope` to narrow JSON parse output from `unknown` before current/legacy payload validators run.
  - Removed direct `JSON.parse(...) as PersistedBuilderEnvelope` casts from current and legacy load branches.
  - Added tests for non-object current envelopes, current envelopes without payload, and non-object legacy envelopes.
- Review:
  - Controller reviewed the W10 diff after validation and found no persistence key/version/save-shape/migration/current-precedence drift.
- Validation:
  - `npx vitest run src/features/builder/builder-persistence.test.ts --run` passed with 18 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder/builder-persistence.ts src/features/builder/builder-persistence.test.ts` passed.
- R9 complete: W10 review recorded.
- J11 active: choose the next post-persistence-parser hardening tranche if continuing.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`

### 2026-05-23 - W11 CSS rail/button dedupe landed

- J11 selected `C12` Rail/button CSS dedupe as W11.
- Root-fix reasoning: after W9 established the picker CSS contract, the remaining CSS duplication could be handled as selector consolidation without JSX class-name churn.
- W11 implementation:
  - Grouped `.builder-v2-lineup-button` and `.builder-v2-adaptive-picker-trigger` base/hover styles.
  - Grouped desktop `.builder-v2-team-row` and adaptive `.builder-v2-adaptive-team-button` base, pseudo-element, active, hover, and add-row styles.
  - Preserved adaptive-only active rail inset shadow as its own rule.
  - Did not change component markup, mobile structure, teams-list shape, DnD behavior, dependencies, or `docs/design/**`.
- Review:
  - Controller reviewed the W11 diff and confirmed it is CSS-only selector consolidation with adaptive-only active accent preserved.
- Validation:
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npm run build:quiet` passed.
- R10 complete: W11 review recorded.
- J12 active: choose the next post-CSS-dedupe hardening tranche if continuing.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-architecture-hardening/goal.md.`
