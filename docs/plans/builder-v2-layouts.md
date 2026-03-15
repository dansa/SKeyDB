# Builder V2 Layouts — Mobile Slice Status

**Status:** Done  
**Last updated:** 2026-03-15

## Goal

Ship a coherent responsive builder experience across desktop/tablet/mobile with one interaction model and one sizing system.  
This document tracks the shipped mobile builder slice and the handoff into tablet/desktop work.

## What Is Shipped In This Slice

1. Focused mobile flow now uses one stage system (no legacy portrait drawer fallback path).
2. Focused code is split by ownership into focused-card modules, with a thin container.
3. Overview and focused both size from shared mobile metrics and measured host space.
4. Overview chooses `2x2` or `4x1` by fit, not old orientation semantics.
5. The top import/export/reset toolbar is outside the `svh` working shell.
6. At rock-bottom card limits, overview overflow is handed to page scroll instead of inner grid scroll.
7. Preview shell and device shell behavior are explicit (`preview` uses min-height; `device` uses fixed `svh` shell).
8. Quick Lineup now ships as a real mobile mode with v1-grade start/cancel/finish semantics, portrait and landscape layouts, shared slot placeholder treatment, and inline picker routing.
9. Mobile builder staging uses sticky page-level snap and view-transition preservation so the builder behaves like an app zone instead of a drifting page section.
10. Picker drag-and-drop is disabled in mobile shells while team-row drag support stays intact.
11. Compact tabs stay bounded without horizontal scroll, including short-landscape single-row handling and low-height overview overflow fallback.

## Key Architecture Decisions

1. Keep `MobileLayout` as orchestration only: view state, picker routing, and shell composition.
2. Keep focused visuals in focused-card modules (`FocusedStage`, `FocusedLoadout`, `FocusedPortrait`, `FocusedShared`).
3. Keep shared sizing rules in `mobile-layout-metrics.ts` and focused stage thresholds in `focused-layout.ts`.
4. Keep Zustand usage selector-based and store-native, matching the repo pattern.
5. Prefer measured available space (`useMeasuredElementSize`) over viewport heuristics for card fitting.

## Completed Verification

1. `npm run verify`

## Next Slice

Tablet and desktop builder bundles are the next clear target. Mobile is in a good enough state to stop being the blocker.
