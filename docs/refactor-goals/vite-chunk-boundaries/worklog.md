# Refactor Goal Worklog: vite-chunk-boundaries

## Entries

### 2026-05-19 - Goal packet created

- Source: user requested a Refactor Discipline audit of large Vite chunks, with scout agents and a goal-prep packet if actionable concerns were found.
- Intake: explicitly skipped by user for this bundle audit/fix-it slice; scope limited to chunk boundaries and related data/loading seams.
- Evidence:
  - `npm run build -- --logLevel info` reported Vite's chunk warning.
  - Largest JS chunks measured from `dist/assets`: `useTimelineNow-*.js` about 879.6 kB minified / 109.7 kB gzip, `catalogRepository-*.js` about 486.0 kB / 58.4 kB gzip, `awakener-assets-*.js` about 288.3 kB / 37.8 kB gzip, app entry about 279.8 kB / 90.2 kB gzip.
  - Local inspection showed `src/domain/dzone.ts` eagerly imports every D-Zone season JSON through `import.meta.glob(..., {eager: true})`, and that generated archive data appears inside the over-limit shared chunk.
  - Scout 019e3d8c-725b-7a42-bfaa-8c5dac330069 mapped public-v3 catalog/search/data dependency candidates.
  - Scout 019e3d8c-898c-7490-a109-48615f81cabc mapped route/lazy boundary candidates.
- Active task: J1 Judge D-Zone archive chunk split.
- Validation: `npm run build -- --logLevel info`.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/vite-chunk-boundaries/goal.md.`

### 2026-05-19 - D-Zone archive boundary split

- Source: user asked to solve worthwhile large chunks that could smooth browsing without large regression risk.
- Skills: `$refactor-architecture`, `$refactor-typescript`, `$refactor-react`, `$refactor-characterization-tests`.
- Slice: split D-Zone summary/current-season lookup from full historical season archives.
- Files changed:
  - `src/domain/dzone.ts`
  - `src/pages/DZonePage.tsx`
  - `src/pages/DZoneHistoryPage.tsx`
  - `src/pages/d-zone/useDZoneSeason.ts`
  - D-Zone page/domain tests
  - `src/pages/timeline/timelineDZoneSummary.ts`
- Behavior preserved:
  - Current D-Zone page still renders the active season.
  - History page still supports deep-linked season selection and browser interactions.
  - Zod validation remains at the JSON import boundary for loaded season archives.
- Measurement:
  - Before: `useTimelineNow-*.js` about 879.6 kB minified / 109.7 kB gzip and above Vite's warning threshold.
  - After: `useTimelineNow-*.js` about 130.1 kB minified / 24.9 kB gzip.
  - D-Zone season archives now emit as small on-demand chunks, generally about 7-17 kB minified each.
  - No Vite `>500 kB` chunk warning remained in the measured build; largest remaining JS chunk was `catalogRepository-*.js` about 486.0 kB minified / 58.4 kB gzip.
- Validation:
  - `npm run test -- src/domain/dzone.test.ts src/pages/DZonePage.test.tsx src/pages/DZoneHistoryPage.test.tsx src/pages/d-zone/d-zone-view-model.test.ts src/pages/d-zone/d-zone-countdown.test.ts src/pages/timeline/TimelinePage.test.tsx`
  - `npm run build -- --logLevel info`
- Decision: do not fold the broader public-v3 catalog/search split into this tranche. It is below the Vite warning threshold after C1, gzip impact is modest, and the consumer blast radius is wider.
