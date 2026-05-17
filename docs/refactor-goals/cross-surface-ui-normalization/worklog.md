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
