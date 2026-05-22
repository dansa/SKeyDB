# Refactor Goal Worklog: builder-v2-rebuild

## Entries

### 2026-05-22 - Goal packet created

- Source: User requested a ground-up Builder V2 page, barebones visual baseline, flow informed by `builder/mobile-ux`, and a full six-scout scoping pass using Refactor Discipline.
- Intake: Completed from prompt and repo facts. Mode is refactor goal workflow; risk posture preserves existing `/builder`; first tranches are isolated to `/builder-v2`.
- Scout task: Six read-only scout agents completed and were closed after completion.
- Scout evidence:
  - Current contracts: use `builderDraftStore`, public-id migrations/persistence, `team-state`, team collection helpers, ownership projection, action factories, import/export helpers, DnD ids, and detail modal store.
  - UX branch: salvage mobile overview/focused/picker/quick-lineup and tablet/desktop layout concepts only; drop old v2 store, persistence, and old visual implementation.
  - Tests: existing pure helper/store tests carry; current page tests are behavior references but DOM-coupled.
  - Visual baseline: use `DESIGN.md`, `PRODUCT.md`, D-Zone/Timeline/database patterns, and `docs/design` screenshots; avoid old builder blue-heavy chrome.
  - Route: add lazy `/builder-v2` in `src/App.tsx`; do not add nav entry in the first slice.
  - Interaction risks: do not mutate slots directly; preserve helper paths for realm caps, duplicate identity, support transfer, quick-lineup focus, and detail overlay navigation.
- Active task: J1, approve first Builder V2 Worker slice.
- Validation: `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-rebuild` passed.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-rebuild/goal.md.`

### 2026-05-22 - User approved first major slice

- Source: User confirmed the goal is healthy and gave go-ahead for first major local Builder V2 slice.
- Added constraints:
  - Use concept images as first-class input.
  - Treat this as long-running local work, not rushed shipping steps.
  - Surface healthier architecture around the known Builder workflow.
  - Keep mockups/sendoff unstaged unless intentionally selected later.
  - Commits may be chunked; `--no-verify` is acceptable for experimental local checkpoints when useful.
- Native Codex goal: active for the first major local Builder V2 slice.
- Subagents: fresh visual/layout and architecture/Judge scouts launched; prior scout handles were already closed after completion.

### 2026-05-22 - First Worker slice approved

- J1 result: approved C1 plus smallest viable C2/C3 as the first Worker.
- Concept: Builder V2 route and bare awakener draft loop shell.
- Allowed files: `src/App.tsx` and `src/features/builder-v2/**`.
- Protected: current `src/features/builder/**`, `builderDraftStore`, persistence/migrations/codecs, generated/domain data, dependencies, nav promotion, and remote state.
- Invariants:
  - `/builder` remains protected.
  - `/builder-v2` is lazy-routed but absent from nav.
  - V2 uses public ids and current builder contracts.
  - Slot assignment/removal goes through helper/model paths, not component-level slot mutation.
  - Concept images guide shell anatomy without overbuilding final polish.
- Active task: W1, build isolated Builder V2 awakener draft loop shell.

### 2026-05-22 - W1 landed and review started

- W1 result: implemented the isolated Builder V2 first slice.
- Product files changed:
  - `src/App.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/builder-v2-test-mocks.ts`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - Added lazy `/builder-v2` route while keeping Builder V2 out of navigation.
  - Added a typed `useBuilderV2Model` facade over current draft store, persistence loader/saver, ownership hydration, search, identity keys, and `team-state` assign/remove helpers.
  - Added a concept-image-informed shell with left teams rail, center active builder, lower team overview, and right picker/armory.
  - Added minimal awakener picker, four active slots, selected slot state, assign, and remove.
  - Kept gear/posse/quick-lineup/drawer/import/export/team polish queued.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 9 tests.
  - `npx vitest run src/features/builder/useBuilderViewModel.test.ts src/features/builder/builder-persistence.test.ts src/features/builder/builder-ownership-projection.test.ts` passed, 3 files / 50 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed.
  - Playwright smoke rendered `http://127.0.0.1:5173/#/builder-v2` at 1440x1000 and 390x844; console output was only the React DevTools info banner.
- Active task: R1, review W1 diff and receipts.
- Subagent: reviewer `019e4ce4-19d7-7420-82a3-01e41d16194f` spawned for read-only W1 review; do not close until it has completed.

### 2026-05-22 - R1 review fixed and closed

- R1 finding: V2 initially used active-team slot helpers without the current builder action layer's cross-team duplicate/transfer guard. That could duplicate a non-support awakener already owned by another team and autosave the duplicate into shared builder persistence.
- Fix:
  - `useBuilderV2Model` now builds a non-support `usedAwakenerByIdentityKey` map like V1.
  - V2 reads the current `skeydb.builder.allowDupes.v1` preference and passes it into `team-state` helper calls.
  - When duplicate identities are not allowed and the owner is another team, V2 blocks the assignment with a message instead of committing the slot update. Full transfer UI remains queued for a later slice.
  - `useBuilderV2Model.test.ts` now covers assigning an in-use awakener from another team and verifies the active team remains unchanged.
- Subagent: reviewer completed and was closed after the finding was recorded.
- Validation after fix:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 10 tests.
  - `npx vitest run src/features/builder/useBuilderViewModel.test.ts src/features/builder/builder-persistence.test.ts src/features/builder/builder-ownership-projection.test.ts` passed, 3 files / 50 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed.
- Active task: none. First major local Builder V2 tranche is complete; broader Builder V2 goal remains active with queued candidates C4-C8.

### 2026-05-22 - C4 gear and posse slice scoped

- Source: User continued the Builder V2 refactor goal and requested the same subagentic assign/review workflow.
- Scout task: Three read-only scouts completed and were closed after completion.
- Scout evidence:
  - `TeamSlot` already carries wheel and covenant loadout state; `Team` carries `posseId`.
  - Existing pure helpers in `team-state.ts` cover wheel/covenant assign, clear, and swap behavior.
  - Posse assignment is team-level state; full V1 transfer-dialog parity remains larger than this slice.
  - V1 tests pin same-team wheel movement, cross-team transfer requests, covenant assignment/swap, and posse transfer behavior.
  - C4 UI should activate the existing Armory tabs and make W1/W2/Covenant plus header Posse targets real controls.
- Judge task: J2 approved C4 as a bounded Builder V2 patch slice under `src/features/builder-v2/**` plus this goal packet.
- Deferred by Judge: old BuilderPage edits, full transfer dialogs, DnD, mobile drawer, persistence/migration changes, dependencies, and global CSS/design-system work.
- Active task: W2, build Builder V2 gear and posse assignment flow.

### 2026-05-22 - W2 landed and reviewed

- W2 result: implemented bounded Builder V2 gear and posse assignment.
- Product files changed:
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - Armory tabs now switch between awakeners, wheels, covenants, and posses.
  - W1/W2/Covenant slot targets are real controls with assign and clear behavior.
  - The team-level Posse target can select, assign, and clear active team `posseId`.
  - Wheel assignment uses existing helper semantics for slot assignment and same-team movement; cross-team duplicate wheel/posse assignment is blocked until transfer UI parity lands.
  - Existing BuilderPage, persistence, migrations, dependencies, and generated data stayed untouched.
- Review:
  - Reviewer found two low-severity false-error paths for repeat-clicking the already assigned wheel or covenant.
  - Fix landed in `useBuilderV2Model`, and `useBuilderV2Model.test.ts` now covers quiet repeated wheel/covenant assignment.
  - Reviewer completed and was closed after the finding and fix were recorded.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 20 tests.
  - `npm test -- --run src/features/builder` passed, 33 files / 251 tests.
  - `npm run lint` passed.
  - `npm run build` passed; existing Vite chunk-size/plugin timing warnings only.
  - Browser smoke rendered `http://127.0.0.1:5173/#/builder-v2` at 1440x1000 and 390x844, assigned an awakener, switched Armory to Wheels, and assigned a wheel.
- Active task: none. C4 is implemented; broader Builder V2 goal remains active with queued C5-C8 follow-ups.

### 2026-05-22 - C6 quick-lineup slice scoped

- Source: User continued the Builder V2 refactor goal.
- Scout task: Three read-only scouts completed:
  - C5 mobile scout mapped `docs/design/Mobile.png` as overview, focused builder, and full-screen picker drawer states. It recommended keeping the desktop shell unchanged and deferring drawer/focus-trap work until the guided focus contract is stronger.
  - C6 quick-lineup scout confirmed `quick-lineup.ts` and `builderDraftStore` already expose the session, focus, start, advance, back, jump, finish, and cancel mechanics needed by Builder V2.
  - Candidate-order scout recommended C6 before C5 because W2 unlocked all assignment targets and quick-lineup is the least risky structural slice after gear/posse.
- Judge task: J3 approved C6 as the next Worker slice.
- Decision: Activate W3, "Build Builder V2 Quick Lineup mode."
- Allowed files: `src/features/builder-v2/**` plus this goal packet's `state.json` and `worklog.md`.
- Protected: current `/builder` files, `src/stores/builderDraftStore.ts`, route glue, persistence/migrations, generated data, dependency files, global CSS outside Builder V2, and remote state.
- In scope:
  - Enable the existing Builder V2 Quick Team Lineup button.
  - Expose quick-lineup session/actions through `useBuilderV2Model` using existing store actions.
  - Synchronize quick-lineup focus with V2 picker tab, active selection, and team posse target.
  - Add compact visible quick-lineup controls and focused V2 tests.
  - Advance steps after successful assignments and support back, skip, finish, and cancel restore.
- Deferred: C5 mobile drawer/focused flow, transfer dialogs, DnD, recommendations/smart sorting, teams overview redesign, import/export parity, and shared store/helper behavior changes.
- Active task: W3, build Builder V2 Quick Lineup mode.

### 2026-05-22 - W3 implemented and review started

- W3 result: implemented Builder V2 Quick Lineup mode inside the approved V2 boundary.
- Product files changed:
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - The V2 Quick Team Lineup button is now active.
  - `useBuilderV2Model` exposes quick-lineup session state and start, next, back, finish, and cancel actions by consuming existing `builderDraftStore` quick-lineup actions.
  - Quick-lineup focus synchronizes V2 `pickerTab`, `activeSelection`, and team-level posse target state.
  - Successful V2 awakener, wheel, covenant, and final posse assignments advance or complete the guided session.
  - Manual slot/loadout/posse target selection during quick-lineup jumps the current step instead of toggling normal selection.
  - V2 hides destructive slot remove/clear controls during quick-lineup to avoid conflicting with guided focus.
  - Existing `/builder`, shared store/helper behavior, persistence, dependencies, and global CSS stayed untouched.
- Characterization:
  - Red run before implementation: targeted V2 tests failed on missing quick-lineup model API, disabled UI, and visible remove controls.
  - Added model tests for start/focus, assignment advance, cancel restore, manual focus jump, and final posse completion.
  - Added page tests for visible controls, picker tab progression, back/next, and cancel restore.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 26 tests.
  - `npm test -- --run src/features/builder` passed, 33 files / 257 tests.
  - `npm run lint` passed.
  - `npm run build` passed; existing Vite chunk-size/plugin timing warnings only.
  - Browser smoke rendered `http://127.0.0.1:5173/#/builder-v2` at desktop 1440x1000 and mobile 390x844, then exercised quick-lineup start, assignment advance, next/back, and cancel.
- Active task: R3, review W3 Builder V2 Quick Lineup mode.

### 2026-05-22 - R3 review passed

- Reviewer: `019e4d1d-96c1-7af2-9f30-9891f5c54a10`.
- Findings: none.
- Reviewer notes:
  - W3 stays inside the approved product scope.
  - W3 uses existing `builderDraftStore` quick-lineup actions and preserves protected files.
  - Focused model/page coverage exists for start, assignment advance, back/next, cancel restore, manual focus jump, and final posse completion.
- Residual risk:
  - C5 mobile drawer/focus-trap flow remains queued.
  - Transfer dialogs, DnD, recommendations, and import/export parity remain queued.
  - Quick-lineup inherits the existing shared-store behavior where starting a session clears the active team and keeps a transient restore snapshot until finish/cancel.
- Active task: none. C6 is implemented and reviewed; broader Builder V2 goal remains active with C5, C7, and C8 queued.

### 2026-05-22 - Designer handoff destination affirmed

- Source: User asked whether the entire goal packet leads into handoff to the designer.
- Decision: Yes. The goal is not merely to land a functional `/builder-v2`; it is to create a healthy local Builder V2 foundation that a designer or design-focused model can safely reshape without having to rediscover builder rules, rebuild workflow state, or inherit old Builder UI debt.
- Packet update:
  - `goal.md` now names designer handoff as the broad destination.
  - `state.json` now tracks designer handoff readiness as a queued focus area.
  - Candidate C9, "Designer handoff bundle", is queued as the final packet/screenshot/concept-traceability handoff slice after core V2 interaction work is healthy.
- Active task: none. The recommended next implementation candidate remains C5 mobile overview/focused/full-screen picker drawer flow.

### 2026-05-22 - C5 mobile drawer scout recorded

- Source: User continued the Builder V2 refactor goal.
- Scouts:
  - `019e4d72-a332-7591-9c83-8e772c2c0ca5`
  - `019e4d72-d0c3-77c3-8a1b-e3ac1d65ce3c`
- Scout evidence:
  - C5 should be a mobile orchestration/layout slice around the existing W3 quick-lineup and picker contracts, not a new quick-lineup state implementation.
  - `useBuilderV2Model` already exposes the needed state and actions: `pickerTab`, `activeSelection`, `activeTeamTarget`, `quickLineupSession`, assignment handlers, and quick-lineup controls.
  - Current mobile behavior is CSS stacking only; it lacks concept-image app states, full-screen picker dialog semantics, Escape handling, and focus return.
  - The smallest useful failing tests should cover a slot target opening a named picker dialog, a wheel target opening the Wheels tab, search focus inside the dialog, Escape close, and focus returning to the invoking control.
- Active task: none. Next step is Judge approval for the bounded C5 Worker scope.

### 2026-05-22 - C5 mobile drawer slice scoped

- Judge: `019e4d75-3aaf-7e91-b87e-594ab81dc839`.
- Decision: Approve C5 as a bounded Worker slice.
- In scope:
  - Mobile overview -> focused builder -> full-screen picker drawer flow for `/builder-v2`.
  - Reuse existing `useBuilderV2Model` state/actions and W3 quick-lineup semantics.
  - Extract reusable picker content so desktop armory and mobile drawer share search, tabs, and result rows.
  - Mobile slot/loadout/posse target controls open a named dialog with correct tab, search focus, Escape close, and focus return.
  - Focused mobile drawer tests and desktop non-regression.
- Deferred: teams redesign, import/export, transfer dialogs, DnD, recommendations, shared store/helper changes, `/builder` edits, nav promotion, dependencies, and global CSS outside Builder V2.
- Active task: W4, build C5 mobile overview and picker drawer flow.

### 2026-05-22 - W4 implemented and R4 review passed

- W4 result: implemented the C5 mobile overview, focused builder, and full-screen picker drawer flow inside the isolated Builder V2 boundary.
- Product files changed:
  - `src/features/builder-v2/BuilderV2MobileLayout.tsx`
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - `/builder-v2` now branches to a mobile-only app-like layout at `<= 768px`.
  - Mobile starts at a team overview, opens a focused slot builder, and uses a full-screen picker drawer for awakeners, wheels, covenants, and posses.
  - The desktop armory and mobile drawer share the same extracted picker content.
  - The mobile drawer has `role="dialog"`, `aria-modal`, an accessible title, search focus on open, Escape close, and focus return to the invoking control.
  - Reopening the same mobile picker target after Escape keeps the intended target instead of toggling model selection off.
  - Mobile quick-lineup derives the visible focused slot from `quickLineupSession.currentStep`, so assignment advance and Back/Next keep the panel aligned with the guided step.
  - Existing `/builder`, `builderDraftStore`, persistence/migrations, generated data, dependencies, route glue, and global CSS outside Builder V2 stayed untouched.
- Characterization:
  - Initial red mobile tests failed because overview/focused/dialog behavior did not exist.
  - Browser smoke found a reopened-same-target Slot 2 assignment edge case; a red test reproduced it before the fix.
  - R4 found a quick-lineup focus drift from Slot 1 covenant to Slot 2 awakener; a red test reproduced it before the derived focus fix.
  - Added page coverage for mobile overview, focused slot, drawer tab/search focus, Escape focus return, same-target reopen, and quick-lineup Slot 1 -> Slot 2 focus sync through assignment plus Back/Next.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 32 tests.
  - `npm test -- --run src/features/builder` passed, 33 files / 263 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed; existing Vite chunk-size and plugin timing warnings only.
  - Browser smoke at `http://127.0.0.1:5173/#/builder-v2` covered desktop assignment with no dialog, mobile overview/drawer search focus/Escape focus return/reopened Slot 2 assignment, quick-lineup Step 2, and Slot 1 -> Slot 2 mobile focus sync with Back/Next.
- Review:
  - Reviewer: `019e4d89-6b1f-73d0-a9d2-13f4b381639f`.
  - Initial findings: one high quick-lineup focus drift and one packaging note about excluding unrelated untracked docs/design and screenshot artifacts.
  - Fix: mobile focus is now derived from quick-lineup current step while quick-lineup is active; normal mobile browsing still uses manual focus.
  - Final reviewer verdict: complete, no findings.
- Packaging:
  - Untracked concept/sendoff files under `docs/design/` and smoke screenshots remain intentionally excluded from W4 staging/commit.
- Active task: none. C5 is implemented and reviewed; broader Builder V2 goal remains active with C7, C8, and C9 queued.

### 2026-05-22 - S6 next-chunk scout recorded

- Source: User continued the Builder V2 refactor goal for the next major chunk.
- Scouts:
  - `019e4d96-1e2e-7381-b0fc-692b748379ef`
  - `019e4d96-5597-7731-a4a4-f2e4daf49857`
  - `019e4d96-89a6-7631-8ff0-1af62064d388`
- Scout evidence:
  - Tablet/adaptive workbench is viable as a standalone slice because Builder V2 currently switches to mobile at `<= 768px`, while CSS collapses the desktop shell at `<= 66rem`, leaving tablet widths as an undesigned stacked desktop fallback.
  - C8 should split: `C8a` import/export parity can reuse existing codecs/import planner/dialog contracts through V2 seams, while `C8b` transfer dialog parity crosses into whole-team transfer mutation semantics and should be separate.
  - Full C7 teams redesign remains queued behind a product/design decision on list-vs-cards and compact/expanded behavior, but `C7a` team overview readiness is viable as a neutral read-only summary/switching surface.
  - C9 final designer handoff is still premature, though the packet can keep accumulating handoff-readiness notes.
- Candidate reconciliation:
  - Added `C6a`, Tablet/adaptive workbench shell.
  - Added `C7a`, Team overview readiness component.
  - Split C8 into `C8a`, Builder V2 import/export parity, and `C8b`, Builder V2 transfer dialog parity.
  - Kept full C7 and C9 queued.
- Active task: none. Next step is Judge approval for one bounded Worker slice.

### 2026-05-22 - C6a tablet/adaptive slice scoped

- Judge: `019e4d99-75d4-7830-a952-205592c7c8c5`.
- Decision: Approve `C6a`, Tablet/adaptive workbench shell, as the next bounded Worker slice.
- Reason:
  - `C6a` fixes a verified breakpoint gap between W1 desktop and W4 mobile.
  - React switches to mobile only at `<= 768px`, while CSS collapses the desktop shell at `<= 66rem`, leaving tablet widths as a stacked fallback instead of a designed pseudo-desktop workbench.
  - It does not require the C7 list-vs-cards decision or the C8 import/export/transfer parity contracts.
- In scope:
  - Explicit adaptive/tablet behavior for `769px..66rem`.
  - Active builder remains the primary surface.
  - Compact teams rail/sidebar for active-team switching only.
  - Adaptive picker drawer/overlay using shared `BuilderV2PickerContent`.
  - Preserve mobile `<= 768px` and desktop `> 66rem`.
  - Focused V2 tests and local Builder V2 CSS.
- Deferred:
  - Full teams overview redesign, list-vs-cards, import/export, transfer confirmations, DnD, recommendations, nav promotion, shared store changes, `/builder` changes, dependencies, persistence, and migrations.
- Active task: W5, build C6a tablet/adaptive workbench shell.

### 2026-05-22 - W5 implemented and R5 review passed

- W5 result: implemented the C6a tablet/adaptive workbench shell inside the isolated Builder V2 boundary.
- Product files changed:
  - `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - `/builder-v2` now has explicit viewport shells: mobile at `<= 768px`, adaptive at `769px..1056px`, and desktop above `1056px`.
  - Adaptive widths render a distinct pseudo-desktop workbench instead of the prior stacked desktop fallback.
  - The adaptive shell keeps active team slots primary, compacts team switching into a narrow rail, and moves the picker into a modal drawer.
  - The adaptive drawer reuses shared picker content, focuses search on open/tab change, closes with Escape, and returns focus to the invoking control.
  - The drawer now blocks background interaction with a full-screen backdrop, body scroll lock, and hidden header/workbench semantics while open.
  - Invalid adaptive assignments stay inside the drawer and surface the model violation as an alert.
  - Existing desktop armory and W4 mobile overview/focused/full-screen picker flows are preserved.
- Characterization:
  - Initial adaptive tests failed red because there was no adaptive workbench, compact adaptive team group, or adaptive picker trigger/drawer.
  - Added page coverage for adaptive shell routing, compact team switching, picker focus/Escape return, wheel-tab drawer opening, invalid no-awakener wheel assignment, and full-wheel-slot no-target behavior.
- Validation:
  - `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx` passed, 1 file / 20 tests.
  - `npx eslint src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/BuilderV2AdaptiveLayout.tsx src/features/builder-v2/BuilderV2Page.test.tsx` passed.
  - `npx vitest run src/features/builder-v2` passed, 2 files / 38 tests.
  - `npm run build` passed; existing Vite chunk-size and plugin timing warnings only.
  - `git diff --check` passed.
  - Browser smoke at `http://127.0.0.1:5173/#/builder-v2` passed at desktop 1440x1000, adaptive 900x1000, adaptive 1024x768 invalid assignment, and mobile 390x844.
- Review:
  - Reviewer: `019e4da3-2094-70b2-b7f4-00f7b21e301f`.
  - Initial findings: untracked adaptive component packaging, modal drawer background operability, invalid assignment focus/message loss, and full-wheel-slot no-target close heuristic.
  - Fixes: staged the new adaptive component, added backdrop/body-lock/background hiding, kept invalid assignments in-drawer with alerts, and tightened wheel close behavior with regression coverage.
  - Final reviewer verdict: no blocking findings.
- Packaging:
  - Untracked concept/sendoff files under `docs/design/` and prior smoke screenshots remain intentionally excluded.
- Active task: none. C6a is implemented and reviewed; broader Builder V2 goal remains active with C7a, C7, C8a, C8b, and C9 queued.

### 2026-05-22 - C8a import/export slice scoped

- Judge: `019e4db4-a09a-7b03-b3ae-f632a3639150`.
- Decision: Approve `C8a`, Builder V2 import/export parity, as the next bounded Worker slice.
- Reason:
  - `C8a` advances core builder usefulness more than team overview polish.
  - V1 import/export is already factored through reusable codecs, planner flow, validation, and shared dialogs.
  - The slice avoids C8b transfer-confirmation parity, which crosses into whole-team transfer mutation semantics.
- In scope:
  - Standard `t1` single-team import into an empty active team.
  - `mt1` multi-team import with replace confirmation.
  - Active-team standard export, all-teams standard export, and active-team in-game export.
  - Duplicate override import flow.
  - Single-team import conflict strategy flow if imported units, wheels, or posse already exist elsewhere.
  - Desktop, adaptive, and mobile V2 surfaces expose a usable import/export path.
- Provisional design note:
  - Import/export action placement is not a final team-overview design decision. Worker may choose the smallest clear local placement and record it as provisional.
  - Worker may reuse V1 `BuilderImportExportDialogs` directly or wrap shared dialog primitives locally, but protected V1 files must not be edited.
- Deferred:
  - C7a team overview readiness, full C7 teams overview, C8b transfer dialogs, DnD, recommendations, nav promotion, persistence/migration changes, dependencies, `/builder` edits, and final C9 handoff.
- Active task: W6, build C8a Builder V2 import/export parity.

### 2026-05-22 - W6 implemented and R6 review passed

- W6 result: implemented C8a Builder V2 import/export parity inside the isolated Builder V2 boundary.
- Product files changed:
  - `src/features/builder-v2/BuilderV2ImportExportActions.tsx`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
  - `src/features/builder-v2/BuilderV2MobileLayout.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - Builder V2 now reuses the existing import/export codecs, planner, validation, and shared dialogs through the V2 model facade.
  - Desktop, adaptive, and mobile shells expose provisional import/export actions.
  - V2 can import a `t1` code into an empty active team, import `mt1` with replace confirmation, handle duplicate override, and handle single-team conflict strategy dialogs.
  - V2 can export the active team, all teams, and the active team in in-game format.
  - Import completion clears quick-lineup/transient selection state so replacement imports do not leave stale active targets behind.
  - Page-level toasts now render through Builder V2.
- Characterization:
  - Initial red tests failed because V2 had no import/export actions or dialog entry points.
  - Added page coverage for `t1` import, adaptive/mobile action exposure, `mt1` replace, duplicate override and `skeydb.builder.allowDupes.v1` persistence, standard active/all exports, active in-game export, and conflict strategy skip.
  - Existing V1 import/export and import-planner tests stayed green as reference behavior.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 44 tests.
  - `npx vitest run src/features/builder/BuilderPage.import-export.test.tsx src/features/builder/import-planner.test.ts` passed, 2 files / 18 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed; existing Vite chunk-size and plugin timing warnings only.
  - `git diff --check` passed.
  - Browser smoke at `http://127.0.0.1:5173/#/builder-v2` passed for desktop Export All, adaptive Import, and mobile Export All dialogs.
  - Browser smoke also caught a mobile topbar stretch regression; fixed locally with `.builder-v2-page--mobile { align-content: start; }` and rechecked.
- Review:
  - Reviewer: `019e4dc1-d637-7373-b010-0602ccfa660a`.
  - Initial findings: no blocking issues. Low finding for missing V2 duplicate override coverage.
  - Fix: added duplicate-illegal import coverage for the Import Uses Duplicates dialog, Enable and Import, allow-dupes persistence, and replace continuation.
  - Final reviewer verdict: no blocking findings.
- Packaging:
  - Untracked concept/sendoff files under `docs/design/` and prior smoke screenshots remain intentionally excluded.
- Active task: none. C8a is implemented and reviewed; broader Builder V2 goal remains active with C7a, C7, C8b, and C9 queued.

### 2026-05-22 - C8b transfer parity slice scoped

- Judge: `019e4dcb-875b-7fc1-a8fb-23d62ca72633`.
- Decision: Approve `C8b`, Builder V2 transfer dialog parity, as the next bounded Worker slice.
- Reason:
  - `C8a` import/export parity is implemented and reviewed in `f2902ac3`.
  - The largest remaining core behavior gap is cross-team conflict handling: V2 currently blocks in-use awakeners, wheels, and posses with messages.
  - V1 already has transfer helper/dialog/resolution contracts that can be reused or adapted without changing `/builder`.
  - This closes more core builder behavior than C7a screenshot/readiness polish and is less product-blocked than full C7.
- In scope:
  - Cross-team awakener conflict opens a transfer confirmation before mutation.
  - Confirmed awakener move clears the source owner and assigns the active target slot.
  - Use-as-support, when available, keeps source ownership, marks target support, and sets level 90.
  - Cross-team wheel conflict opens a transfer confirmation; confirm clears the source wheel socket and assigns the target wheel.
  - Cross-team posse conflict opens a transfer confirmation; confirm clears source team posse and assigns active team posse.
  - Desktop, adaptive, mobile, and Quick Lineup flows avoid competing active modals and preserve focus/step behavior.
- Deferred:
  - DnD transfer parity, team CRUD/reorder, C7a/C7 overview redesign, recommendations, nav promotion, visual handoff polish, dependency changes, persistence/migration changes, `/builder` edits, and remote state.
- Active task: W7, build C8b Builder V2 transfer dialog parity.

### 2026-05-22 - W7 implemented and R7 review passed

- W7 result: implemented C8b Builder V2 transfer dialog parity inside the isolated Builder V2 boundary.
- Product files changed:
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
- Behavior:
  - Builder V2 now reuses the existing transfer request and transfer-resolution contracts for cross-team awakeners, wheels, and posses.
  - Cross-team conflicts open a Move confirmation before mutation.
  - Cancel leaves source and target teams unchanged.
  - Confirm moves the chosen awakener, wheel, or posse and clears the previous owner/socket through public `Team` state.
  - Use as Support keeps the source owner, assigns the active target as support, and sets level 90 when support is available.
  - Adaptive and mobile picker drawers hand off to one accessible transfer dialog instead of leaving the picker/background interactable behind it.
  - Quick Lineup waits on transfer confirmation and advances only after a successful confirm/support action.
- Characterization:
  - Initial red run failed because V2 had no `transferDialog`/`cancelTransfer` API and still blocked cross-team conflicts with messages.
  - Added model coverage for awakener cancel/confirm, Use as Support, wheel confirm, posse confirm, and quick-lineup wait-before-advance behavior.
  - Added page coverage for desktop transfer cancel/confirm and adaptive drawer-to-transfer handoff.
  - Existing V1 transfer-confirm and transfer-resolution tests stayed green as reference behavior.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 49 tests.
  - `npx vitest run src/features/builder/useTransferConfirm.test.ts src/features/builder/usePendingTransferDialog.test.ts src/features/builder/transfer-resolution.test.ts` passed, 3 files / 18 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed; existing Vite chunk-size and plugin timing warnings only.
  - `git diff --check` passed.
  - Browser smoke passed for desktop transfer cancel/confirm, adaptive drawer handoff, mobile focused-picker handoff, and quick-lineup wait-before-confirm/advance.
- Review:
  - Reviewer: `019e4dd8-162d-7583-8762-91859ace71a9`.
  - Findings: none.
  - Final reviewer verdict: pass.
  - Reviewer did not rerun validation locally; controller validation receipts cover the passed commands.
- Packaging:
  - Untracked concept/sendoff files under `docs/design/` and prior smoke screenshots remain intentionally excluded.
- Active task: none. C8b is implemented and reviewed; broader Builder V2 goal remains active with C7a, C7, and C9 queued.

### 2026-05-22 - C7a/C7 functional teams slice scoped

- Source: User continued the Builder V2 refactor goal and clarified that the teams overview now needs functional parity with V1; the exact visual shape can be provisional and may later become a cards/list switcher.
- Scouts:
  - `019e4de1-46f3-75d1-9864-093d3e52b917`
  - `019e4de1-6f17-7d53-8029-1f15b5cbf79e`
  - `019e4de1-9b4e-7e72-af40-4a17338492ba`
- Scout evidence:
  - C7a's safe core is a shared all-teams summary/switcher across desktop/adaptive/mobile.
  - Current desktop has separate team rail and overview strip; adaptive only has compact switching; mobile lacks all-team switching.
  - V1 team-management contracts are available as pure helpers: `MAX_TEAMS`, `addTeam`, `renameTeam`, `deleteTeam`, `reorderTeams`, `isTeamEmpty`, `resetTeam`, and `applyTeamTemplate`.
  - Existing V1 tests characterize add/max teams, empty delete direct, non-empty delete/reset confirmation, inline rename, and helper behavior.
  - No V1 duplicate-team action exists, so team duplication is out of scope.
- Judge: `019e4de3-1818-7321-8a68-6ae9fc375f30`.
- Decision: Approve W8 as a combined C7a plus functional C7 MVP teams slice.
- In scope:
  - Functional Builder V2 team overview/management across desktop, adaptive, and mobile.
  - Add team with `MAX_TEAMS` behavior.
  - Active team switching.
  - Inline rename with trim, blank no-op, Enter/blur commit, and Escape cancel.
  - Empty delete/reset direct; non-empty delete/reset confirmation before mutation.
  - D-Tide 5/10 template application behind confirmation.
  - Simple accessible up/down reorder using existing helper semantics; no DnD.
- Deferred:
  - Final visual polish, card-vs-list product decision, screenshot/share layout, DnD reorder, recommendations, nav promotion, persistence/migration changes, dependencies, `/builder` edits, and the C9 designer handoff bundle.
- Active task: W8, build Builder V2 functional team management overview.

### 2026-05-22 - W8 implemented and R8 fixed

- W8 result: implemented a functional but visually provisional Builder V2 team management overview across desktop, adaptive, and mobile.
- Product files changed:
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
  - `src/features/builder-v2/BuilderV2MobileLayout.tsx`
  - `src/features/builder-v2/BuilderV2TeamManagement.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - Added shared `BuilderV2TeamManagement` surface for desktop, adaptive, and mobile.
  - The V2 model now exposes team add, switch, rename, reset, delete, D-Tide template, cancel/confirm, and up/down reorder actions through existing `team-collection` and `builderDraftStore` contracts.
  - Add respects `MAX_TEAMS` and activates the new team.
  - Rename supports Enter/blur commit, Escape cancel, trim, and blank-name no-op.
  - Empty reset/delete act directly; non-empty reset/delete require confirmation.
  - D-Tide 5/10 templates require confirmation before applying existing helper semantics.
  - Up/down reorder preserves active team identity.
  - Team summaries show posse, slot occupants, support, wheel, and covenant signals for screenshot/readiness context.
- Characterization:
  - Initial red V2 tests failed because the model team operation API and accessible team management region did not exist.
  - Added focused V2 model coverage for add/max, rename, empty/non-empty delete, empty/non-empty reset, D-Tide templates, and reorder.
  - Added focused V2 page coverage for desktop summary/switching, rename UI, destructive/template dialogs, and adaptive/mobile management exposure.
  - Existing V1 `team-collection` and `BuilderPage.team-management` tests stayed green as contract coverage.
- Review:
  - Reviewer: `019e4df6-5a56-7e21-8f30-f000011c13c5`.
  - Initial verdict: needs-fix.
  - Findings:
    - `BuilderV2TeamManagement.tsx` was untracked while imported by tracked files.
    - W8 packet receipt/final audit/worklog were not yet updated.
  - Controller fixes:
    - Kept `BuilderV2TeamManagement.tsx` in the W8 change set for staging/commit.
    - Added explicit empty reset direct-behavior characterization.
    - Removed invalid nested interactive rename input by rendering edit mode as a non-button row header.
    - Updated W8/R8 packet receipts and final audit.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder/team-collection.test.ts src/features/builder/BuilderPage.team-management.test.tsx` passed, 4 files / 80 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed after the final nested-control fix.
  - `npm run build` passed after the final nested-control fix; existing Vite chunk-size and plugin timing warnings only.
  - `git diff --check` passed.
  - Browser smoke passed for `#/builder-v2`: desktop management was present, Add Team added one row, rename actions were present; mobile management was present, Add Team stayed in the mobile overview and did not open the picker. Screenshot capture timed out on the asset-heavy page, so the final smoke used DOM/interaction checks only.
- Packaging:
  - Untracked concept/sendoff files under `docs/design/` and prior smoke screenshots remain intentionally excluded.
  - `BuilderV2TeamManagement.tsx` is a required W8 product file and should be staged with the W8 commit.
- Active task: none. C7a/C7 are functionally implemented and reviewed after controller fixes; C9 designer handoff remains queued.
