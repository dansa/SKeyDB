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
