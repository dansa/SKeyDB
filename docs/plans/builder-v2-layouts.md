# Builder V2 Layouts — Focused + Overview Slice

**Status:** In progress  
**Last updated:** 2026-03-14

## Goal

Ship a coherent responsive builder experience across desktop/tablet/mobile with one interaction model and one sizing system.  
This document tracks the completed focused+overview slice and what remains for quick lineup.

## What Is Shipped In This Slice

1. Focused mobile flow now uses one stage system (no legacy portrait drawer fallback path).
2. Focused code is split by ownership into focused-card modules, with a thin container.
3. Overview and focused both size from shared mobile metrics and measured host space.
4. Overview chooses `2x2` or `4x1` by fit, not old orientation semantics.
5. The top import/export/reset toolbar is outside the `svh` working shell.
6. At rock-bottom card limits, overview overflow is handed to page scroll instead of inner grid scroll.
7. Preview shell and device shell behavior are explicit (`preview` uses min-height; `device` uses fixed `svh` shell).

## Key Architecture Decisions

1. Keep `MobileLayout` as orchestration only: view state, picker routing, and shell composition.
2. Keep focused visuals in focused-card modules (`FocusedStage`, `FocusedLoadout`, `FocusedPortrait`, `FocusedShared`).
3. Keep shared sizing rules in `mobile-layout-metrics.ts` and focused stage thresholds in `focused-layout.ts`.
4. Keep Zustand usage selector-based and store-native, matching the repo pattern.
5. Prefer measured available space (`useMeasuredElementSize`) over viewport heuristics for card fitting.

## Completed Verification

1. `npm run lint`
2. `npm run test -- --run`
3. `npm run build`

`npm run verify` is still blocked by unrelated pre-existing Prettier drift outside this slice.

## Next Slice

Quick lineup mobile UX and examples are intentionally excluded from this commit set and handled separately.
