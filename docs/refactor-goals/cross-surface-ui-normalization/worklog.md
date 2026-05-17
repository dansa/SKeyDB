# Refactor Goal Worklog: cross-surface-ui-normalization

## Entries

### 2026-05-17 - Goal packet created

- Source: User requested @impeccable extract plus `$refactor-discipline:refactor-goal-prep` normalization across Database browse, Timeline, and D-zone.
- Intake: Completed from equivalent prompt decisions. Risk posture is behavior-preserving frontend normalization with allowed visual drift toward the existing canon. Protected areas include database detail modal internals, Builder/Collection redesigns, package files, and unrelated data/domain behavior.
- Repo facts: Vite/React/TypeScript/Tailwind v4 app, npm scripts include `lint`, `test`, `build`, `verify`.
- Impeccable context: PRODUCT/DESIGN loaded; SKeyDB register is product. Current canon is Timeline/D-zone, with Database browse conventions now documented.
- Complexity evidence: Ran `audit-complexity.mjs --root . --json` and `audit-performance-patterns.mjs --root . --json --ts-only`. In-scope leads include D-zone history/browser complexity, Timeline banner artwork complexity, and database browse render-derived work; larger builder/collection/detail-modal findings are outside this goal.
- Active task: S1, read-only Scout for cross-surface UI normalization candidates.
- Validation: Packet checker pending.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/cross-surface-ui-normalization/goal.md.`

### 2026-05-17 - Scout reconciled

- Scout evidence: Database, Timeline, and D-zone read-only subagents completed. Findings were reconciled into C1-C23 in `state.json`.
- Additional evidence: Complexity and performance scans mapped in-scope leads for D-zone history, Timeline banner artwork, and database browse render-derived work.
- Candidate policy: Lower-priority candidates remain queued. C1 and C9 were selected for the first tranche because they are cross-surface root fixes with small visual risk.
- State transition: S1 done. J1 done with selected candidates C1 and C9. W1 done after implementation. R1 active for review.

### 2026-05-17 - W1 implemented and validated

- Slice: Shared product-surface CSS tokens plus neutral scrollbar utility.
- Files changed: `src/index.css`, `src/pages/timeline/timeline.css`, `src/pages/timeline/BannerInfoDrawer.tsx`, `src/pages/d-zone/d-zone.css`, `src/pages/d-zone/DZoneHistoryBrowser.tsx`, `src/features/database/database.css`, `src/ui/search/SearchCombobox.tsx`.
- What changed: Added global `--ui-*` surface/control/focus/label/motion/scrollbar tokens; mapped D-zone local variables to global UI tokens; migrated Timeline and Database CSS motion/control references; introduced `.ui-scrollbar` while preserving `.database-scrollbar` as a compatibility alias; migrated Timeline, D-zone, and shared search consumers to `.ui-scrollbar`.
- Behavior preserved: No route, modal, data, card, drawer, filter, or D-zone wave semantics changed.
- Validation:
  - `npx vitest run src/pages/TimelinePage.test.tsx src/pages/timeline/TimelineArchiveSection.test.tsx src/pages/timeline/usePoolCycling.test.tsx src/pages/d-zone/DZoneWaveCard.test.tsx src/pages/DZonePage.test.tsx src/pages/DZoneHistoryPage.test.tsx src/features/database/DatabaseRoutes.test.tsx src/features/database/internal/DatabaseGrid.test.tsx` passed.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Browser checks passed for `/database`, `/database/wheels`, `/database/covenants`, `/timeline`, `/d-zone`, and `/d-zone/history`; no horizontal overflow observed and shared tokens resolved on rendered pages.
- Open items: Broad goal is not fully complete. C2-C8, C10-C23, M1, and M2 remain queued.

### 2026-05-17 - R1 review

- Verdict: pass-with-followups.
- Simplification check: Before W1, D-zone, Timeline, and Database repeated product-surface values independently, and `.database-scrollbar` was a global utility with a feature-specific name. After W1, shared `--ui-*` tokens supply the first product-surface vocabulary, feature CSS keeps layout and semantic ownership, and `.ui-scrollbar` is the neutral shared utility with a compatibility alias.
- Governance check: Intake is complete, C1-C23 are reconciled in `state.json`, C1 and C9 are implemented, C2-C8 and C10-C23 remain queued. No package files, AGENTS.md, Builder, Collection, or database detail modal internals were edited.
- Validation after final code changes: `npm run lint`, `npm run build:quiet`, `git diff --check`, and the goal checker passed. Earlier focused tests and browser checks passed for this slice.
- State transition: R1 done. No active task remains; broad goal packet remains active with queued follow-ups.

### 2026-05-17 - W1 checkpoint committed and S2 opened

- Commit: `11de4a4 refactor: normalize database browse surfaces`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- State transition: S2 active as a read-only Scout bucket pass for the remaining candidates. The controller will choose the next Worker slice after reconciling these reports.

### 2026-05-17 - S2 reconciled and W2 opened

- Scout evidence: Three read-only scouts completed and were closed after completion. Shared vocabulary ranked C2+C14 first; D-zone ranked C16/C23/C15/C13; Timeline/database ranked C11/C17/C18/C10/C20/C7/C22.
- Decision: J2 selected C2+C14 as the next Worker slice because it is the clearest cross-surface root fix after C1/C9: shared compact pressed-control styling without turning D-zone alert behavior or database filter behavior into a generic interaction API.
- State transition: S2 done. J2 done. W2 active.
- Validation target: focused database route and D-zone tests, lint, build, diff check, and browser checks for `/database`, `/database/wheels`, and `/d-zone`.

### 2026-05-17 - W2 implemented and reviewed

- Slice: Compact pressed-control vocabulary for C2+C14.
- Files changed: `src/index.css`, `src/ui/filters/FilterChipButton.tsx`, `src/features/database/internal/EntityViewControls.tsx`, `src/pages/d-zone/DZoneSeasonInspector.tsx`, `src/pages/d-zone/d-zone.css`.
- What changed: Added shared `.ui-compact-control` utility variants for field, pressed, and dense controls; migrated database filter chips and sort controls; migrated D-zone alert buttons to the shared pressed-control styling while keeping alert behavior local.
- Design decision: D-zone alert buttons now use the product sans stack rather than Droid Serif, matching the Earned Serif rule for controls.
- Validation:
  - `npx vitest run src/features/database/DatabaseRoutes.test.tsx src/pages/DZonePage.test.tsx src/pages/d-zone/DZoneWaveCard.test.tsx` passed, 44 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks passed for `/database`, `/database/wheels`, and `/d-zone`; no horizontal overflow, D-zone alert buttons visible with shared class, 2px radius, and sans font.
- Review verdict: pass-with-followups.
- State transition: W2 done. R2 done. C2 and C14 implemented.

### 2026-05-17 - W2 checkpoint committed and W3 opened

- Commit: `126294b refactor: share compact control styling`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J3 selected C11 because Timeline banner hero and drawer duplicate tag/custom-tag/pricing composition while keeping different visual containers.
- State transition: J3 done. W3 active for a Timeline-local banner metadata helper/component. No global primitive extraction is approved for this slice.

### 2026-05-17 - W3 implemented and reviewed

- Slice: Timeline-local banner metadata composition helper for C11.
- Worker: Halley implemented the slice in `src/pages/timeline/BannerCard.tsx`, `src/pages/timeline/BannerInfoDrawer.tsx`, and new `src/pages/timeline/bannerMetadata.tsx`.
- Controller review adjustment: Added `renderWhenEmpty` so the drawer preserves the previous empty metadata row wrapper behavior while the hero still omits an empty row.
- Behavior preserved: Hero tag order and four-item cap; drawer unlimited tags; ended/active colors; separator colors; pricing-mode formatting.
- Validation:
  - Subagent ran `npx vitest run src/pages/timeline/BannerCard.test.tsx`, 14 tests passed.
  - Controller ran `npx vitest run src/pages/timeline/BannerCard.test.tsx src/pages/TimelinePage.test.tsx`, 24 tests passed.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser check for `/timeline` passed with no horizontal overflow; banner hero metadata and drawer toggle present.
- Review verdict: pass-with-followups.
- State transition: W3 done. R3 done. C11 implemented.

### 2026-05-17 - W3 checkpoint committed and W4 opened

- Commit: `2e3f166 refactor: share timeline banner metadata`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J4 selected C17 because database card title markup and first-24 image priority are repeated across awakener, wheel, and simple-artifact cards.
- State transition: J4 done. W4 active for a database-internal card title/priority helper. This stays inside `src/features/database/internal/**` and does not create a global card abstraction.

### 2026-05-17 - W4 implemented and reviewed

- Slice: Database-internal card title and image priority helpers for C17.
- Files changed: `AwakenerGridCard.tsx`, `WheelGridCard.tsx`, `SimpleArtifactGridCard.tsx`, new `DatabaseGridCardTitle.tsx`, and new `database-grid-card-priority.ts`.
- What changed: Shared the repeated title class/title-attribute pattern and the first-24 eager image priority rule across database card producers.
- Behavior preserved: Card frame layout, accessible open actions, title text, route semantics, asset lookup, and eager/lazy image boundary.
- Validation:
  - `npx vitest run src/features/database/internal/DatabaseGrid.test.tsx src/features/database/internal/AwakenerGridCard.test.tsx src/features/database/internal/WheelGridCard.test.tsx` passed, 4 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/database`, `/database/wheels`, and `/database/posses` passed; no overflow, title nodes matched card counts, and eager images stayed at 24 per grid.
- Review verdict: pass-with-followups.
- State transition: W4 done. R4 done. C17 implemented.

### 2026-05-17 - W4 checkpoint committed and W5 opened

- Commit: `8ef7bb3 refactor: share database card helpers`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J5 selected C16 as the next D-zone-local root fix. D-zone media buttons have repeated tile behavior, but the global C5 media-tile primitive is not justified until this local behavior is simpler and proven stable.
- State transition: J5 done. W5 active for local `DZoneRelicButton` and `DZoneMonsterButton` extraction inside the D-zone wave card concept.

### 2026-05-17 - W5 implemented and reviewed

- Slice: D-zone local relic/monster media-button extraction for C16.
- Worker: Curie extracted `RelicButton` in `DZoneWaveCard.tsx`; `MonsterButton` was already local and remains unchanged.
- Behavior preserved: Collapsed relic overflow stays `aria-hidden`/`tabIndex=-1`; collapsed monster accessibility limit remains 6; expanded waves render all relics/monsters; selected alert level chips only show while expanded; labels remain wave/entity-specific.
- Validation:
  - Subagent ran `npx vitest run src/pages/d-zone/DZoneWaveCard.test.tsx`, 6 tests passed.
  - Controller ran `npx vitest run src/pages/d-zone/DZoneWaveCard.test.tsx src/pages/DZonePage.test.tsx src/pages/DZoneHistoryPage.test.tsx`, 22 tests passed.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/d-zone` and `/d-zone/history` passed with no overflow and expected wave/button states.
- Review verdict: pass-with-followups.
- State transition: W5 done. R5 done. C16 implemented. C5 global media tile remains queued for terminal revisit.

### 2026-05-17 - W5 checkpoint committed and W6 opened

- Commit: `8bd48fe refactor: extract d-zone media buttons`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J6 selected C23 because current and history D-zone pages duplicate database popover provider/root wiring around the same local hook.
- State transition: J6 done. W6 active for a D-zone-local popover surface wrapper. No database popover internals or modal/detail internals are approved for this slice.

### 2026-05-17 - W6 implemented and reviewed

- Slice: D-zone local popover surface wrapper for C23.
- Files changed: `src/pages/d-zone/DZonePopoverSurface.tsx`, `src/pages/DZonePage.tsx`, `src/pages/DZoneHistoryPage.tsx`.
- What changed: `DZonePopoverSurface` now owns `useDZoneDatabasePopovers`, `DatabasePopoverContext.Provider`, and `DatabasePopoverRoot`; current/history pages render their page content through it and keep page-specific handlers.
- Behavior preserved: Popover outside-click preference, monster/relic popover handlers, route/query behavior, history drawer behavior, and wave rendering.
- Validation:
  - `npx vitest run src/pages/DZonePage.test.tsx src/pages/DZoneHistoryPage.test.tsx` passed, 16 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/d-zone` and `/d-zone/history` passed with no overflow.
- Review verdict: pass-with-followups.
- State transition: W6 done. R6 done. C23 implemented.

### 2026-05-17 - W6 checkpoint committed and W7 opened

- Commit: `d97efde refactor: share d-zone popover shell`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J7 selected C13 because current/history D-zone pages compute the same active-season countdown behavior through two local functions.
- State transition: J7 done. W7 active for a tiny D-zone countdown helper used by current and history pages.

### 2026-05-17 - W7 implemented and reviewed

- Slice: Shared D-zone countdown helper for C13.
- Files changed: `src/pages/d-zone/d-zone-countdown.ts`, `src/pages/d-zone/d-zone-countdown.test.ts`, `src/pages/DZonePage.tsx`, `src/pages/DZoneHistoryPage.tsx`, `src/pages/d-zone/d-zone-history-view-model.ts`, `src/pages/d-zone/d-zone-history-view-model.test.ts`.
- What changed: Current and history pages now use one `getDZoneCountdownDisplay` helper; countdown behavior coverage moved to the helper boundary.
- Behavior preserved: Active seasons return countdown text, ended seasons return an empty string, and route/date behavior is unchanged.
- Validation:
  - `npx vitest run src/pages/d-zone/d-zone-countdown.test.ts src/pages/d-zone/d-zone-history-view-model.test.ts src/pages/DZonePage.test.tsx src/pages/DZoneHistoryPage.test.tsx` passed, 23 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/d-zone` and `/d-zone/history` passed with countdown and waves rendered.
- Review verdict: pass-with-followups.
- State transition: W7 done. R7 done. C13 implemented.

### 2026-05-17 - W7 checkpoint committed and W8 opened

- Commit: `74fac40 refactor: share d-zone countdown helper`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J8 selected C15/C6 because `DZoneHistoryBrowser` still mixes drawer focus behavior, archive note disclosure, search, year groups, and season buttons.
- State transition: J8 done. W8 active for a D-zone-local subcomponent split inside `DZoneHistoryBrowser.tsx`. Modal/focus behavior must remain in the same file and unchanged.

### 2026-05-17 - W8 implemented and reviewed

- Slice: D-zone history browser subcomponent split for C15/C6.
- Files changed: `src/pages/d-zone/DZoneHistoryBrowser.tsx`.
- What changed: Added local `ArchiveDataNote`, `HistorySearch`, `HistoryYearGroup`, and `HistorySeasonButton` components; drawer modal/focus behavior remains in the parent.
- Behavior preserved: Escape/backdrop/close, body overflow restore, focus return/trap, search, archive note, year expansion, selected labels, and URL selection behavior.
- Validation:
  - `npx vitest run src/pages/DZoneHistoryPage.test.tsx src/pages/d-zone/d-zone-history-view-model.test.ts` passed, 16 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser check for `/d-zone/history` passed with no overflow and expected year/search/season controls.
- Review verdict: pass-with-followups.
- State transition: W8 done. R8 done. C15 and C6 implemented.

### 2026-05-17 - W8 checkpoint committed and W9 opened

- Commit: `b786f24 refactor: split d-zone history browser`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J9 selected C18 because database browse sort labels/directions live in `EntityBrowseViews.tsx`, which should remain closer to orchestration and rendering.
- State transition: J9 done. W9 active for a database-browse sort-label config helper and focused tests.

### 2026-05-17 - W9 implemented and reviewed

- Slice: Database browse sort label config extraction for C18.
- Files changed: `src/features/database/browse/EntityBrowseViews.tsx`, `databaseBrowseSortLabels.ts`, and `databaseBrowseSortLabels.test.ts`.
- What changed: Moved awakener/database and wheel sort labels/direction labels into a pure helper with direct tests.
- Behavior preserved: Exact labels, sort state, view-model sorting, and control behavior.
- Validation:
  - `npx vitest run src/features/database/browse/databaseBrowseSortLabels.test.ts src/features/database/DatabaseRoutes.test.tsx` passed, 36 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/database` and `/database/wheels` passed with expected sort labels and no overflow.
- Review verdict: pass-with-followups.
- State transition: W9 done. R9 done. C18 implemented.

### 2026-05-17 - W9 checkpoint committed and W10 opened

- Commit: `51f4581 refactor: extract database sort labels`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J10 selected C20 because `DatabaseCatalogGrid` still mixes grid rendering, empty state, context provider, and hybrid-card measurement.
- State transition: J10 done. W10 active for an internal `useMeasuredHybridCardMode` extraction with layout behavior preserved.

### 2026-05-17 - W10 implemented and reviewed

- Slice: Database hybrid-card measurement hook extraction for C20.
- Files changed: `src/features/database/internal/DatabaseCatalogGrid.tsx`, new `useMeasuredHybridCardMode.ts`.
- What changed: Moved the 620px threshold, pending/poster/dossier mode resolution, requestAnimationFrame measure, window resize fallback, and ResizeObserver logic into a dedicated internal hook.
- Behavior preserved: Hybrid grid classes, poster/dossier mode semantics, non-hybrid poster mode, empty state, and rendered card counts.
- Validation:
  - `npx vitest run src/features/database/internal/DatabaseGrid.test.tsx` passed.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/database` and `/database/wheels` passed with hybrid grids rendered and no overflow.
- Review verdict: pass-with-followups.
- State transition: W10 done. R10 done. C20 implemented.

### 2026-05-17 - W10 checkpoint committed and W11 opened

- Commit: `d287b0f refactor: split database card measurement`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J11 selected C10 because `EventList` and `TimelineBannersSection` repeat the same active/upcoming/ended archive-section shell while keeping different card renderers.
- State transition: J11 done. W11 active for a Timeline-local status-section renderer. This is intentionally not a global primitive.

### 2026-05-17 - W11 implemented and reviewed

- Slice: Timeline active/upcoming/archive section renderer for C10.
- Files changed: `src/pages/timeline/TimelineStatusSections.tsx`, `src/pages/timeline/EventList.tsx`, `src/pages/timeline/TimelineBannersSection.tsx`.
- What changed: Added `TimelineStatusSections` to render the active content and upcoming/ended `TimelineArchiveSection` blocks; events and banners now pass their own grid classes and item renderers.
- Behavior preserved: Active event rows still render inside a `ul`; banner active cards keep eager artwork loading while upcoming/ended cards stay lazy; section ids, expansion state, and archive aria/inert behavior remain owned by existing Timeline helpers.
- Validation:
  - `npx vitest run src/pages/timeline/EventList.test.tsx src/pages/timeline/TimelineArchiveSection.test.tsx src/pages/TimelinePage.test.tsx src/pages/timeline/BannerCard.test.tsx` passed, 35 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/timeline` passed at desktop and mobile widths with active/upcoming/ended event/banner sections rendered.
- Review verdict: pass-with-followups.
- State transition: W11 done. R11 done. C10 implemented.

### 2026-05-17 - W11 checkpoint committed and W12 opened

- Commit: `c14232c refactor: share timeline status sections`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J12 selected C21 because database grid card buttons had both `aria-label` and `aria-labelledby`, while `aria-labelledby` already provided the intended accessible name.
- State transition: J12 done. W12 active for a database-internal accessible-name cleanup.

### 2026-05-17 - W12 implemented and reviewed

- Slice: Database card accessible-name cleanup for C21.
- Files changed: `src/features/database/internal/DatabaseGridCardFrame.tsx`, `AwakenerGridCard.tsx`, `WheelGridCard.tsx`, `SimpleArtifactGridCard.tsx`, and `src/features/database/DatabaseRoutes.test.tsx`.
- What changed: Removed producer `ariaLabel` plumbing and the redundant button `aria-label`; card buttons now use the existing hidden action text plus visible title through one `aria-labelledby` chain.
- Behavior preserved: Card buttons keep accessible names like `View details for Alpha`; visible titles, image alt text, click behavior, and priority behavior are unchanged.
- Validation:
  - `npx vitest run src/features/database/internal/DatabaseGrid.test.tsx src/features/database/internal/WheelGridCard.test.tsx src/features/database/DatabaseRoutes.test.tsx` passed, 34 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser checks for `/database`, `/database/wheels`, and `/database/posses` passed with card grids rendered and no obvious overflow.
- Review verdict: pass-with-followups.
- State transition: W12 done. R12 done. C21 implemented.

### 2026-05-17 - W12 checkpoint committed and W13 opened

- Commit: `18c6c64 refactor: simplify database card names`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J13 selected C19 because awakener and wheel filters duplicated mobile open state, generated ids, toggle grids, and conditional filter panels.
- State transition: J13 done. W13 active for a database-internal mobile filter group extraction.

### 2026-05-17 - W13 implemented and reviewed

- Slice: Database mobile filter group extraction for C19.
- Files changed: `src/features/database/internal/DatabaseChipPrimitives.tsx`, `DatabaseChipPrimitives.test.tsx`, `DatabaseFilters.tsx`, and `WheelDatabaseFilters.tsx`.
- What changed: Added `CatalogMobileFilterGroup` to own mobile toggle/panel ids, one-open-panel behavior, and panel rendering; awakener and wheel filters now pass descriptor arrays.
- Behavior preserved: Desktop filter rows stay local; search inputs, filter ids, URL/history state, and filter handlers are unchanged.
- Validation:
  - `npx vitest run src/features/database/internal/DatabaseChipPrimitives.test.tsx src/features/database/DatabaseRoutes.test.tsx src/features/database/browse/useDatabaseBrowseState.test.tsx` passed, 39 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed.
  - `git diff --check` passed.
  - Mobile browser checks for `/database` and `/database/wheels` passed: one-open-panel behavior and panel visibility were correct.
- Review verdict: pass-with-followups.
- State transition: W13 done. R13 done. C19 implemented.

### 2026-05-17 - W13 checkpoint committed and W14 opened

- Commit: `d46dca5 refactor: share database mobile filters`.
- Commit validation: The repo pre-commit hook ran `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, and `npm run build:quiet`; all passed.
- Decision: J14 selected C22 because `TimelinePage` still mixed route state, masthead D-zone derivation, section scroll behavior, content/price controls, section headers, data composition, and modal wiring.
- State transition: J14 done. W14 active for Timeline-local page orchestration helpers.

### 2026-05-17 - W14 implemented and reviewed

- Slice: Timeline page orchestration seam for C22.
- Files changed: `src/pages/TimelinePage.tsx`, `src/pages/timeline/TimelineContentControls.tsx`, `TimelinePageSection.tsx`, `timelineDZoneSummary.ts`, and `useTimelineSectionScroll.ts`.
- What changed: Moved content/price controls, section header markup, D-zone masthead summary derivation, and section scroll effect into Timeline-local helpers.
- Behavior preserved: `view` and `section` search params, reduced-motion scroll behavior, D-zone masthead text/countdown, price display controls, and `timeline-overlay` detail source.
- Validation:
  - `npx vitest run src/pages/TimelinePage.test.tsx src/pages/timeline/EventList.test.tsx src/pages/timeline/TimelineArchiveSection.test.tsx` passed, 21 tests.
  - `npm run lint` passed.
  - `npm run build:quiet` passed after widening `useTimelineSectionScroll` to accept `undefined` from `parseTimelineSectionId`.
  - `git diff --check` passed.
  - Goal checker passed.
  - Browser check for `/timeline` passed with controls, D-zone masthead summary, event/banner sections, and archive toggles rendered.
- Review verdict: pass-with-followups.
- State transition: W14 done. R14 done. C22 implemented.
