# Awakener Stat Scaling Analysis

**Status:** Shipped and validated  
**Date:** 2026-03-06  
**Context:** Exact level 1-90 awakener CON / ATK / DEF calculation for the database detail modal

## Summary

The earlier interpolation note was wrong because it was working from incomplete sample data. The database now uses the exact primary-stat model, carries the missing schema needed to resolve any level from 1 to 90, and exposes that through the database level slider.

## Implemented Model

### Primary stats

Each awakener now stores:
- Canonical Lv. 60 primary stats in `stats`
- Per-stat growth multipliers in `statScaling`
- Explicit `primaryScalingBase: 20 | 30`

The resolver is:

```ts
stat(level) = Math.ceil((primaryScalingBase + level) * scaling)
```

Where:
- `primaryScalingBase = 20` for non-limited awakeners
- `primaryScalingBase = 30` for limited awakeners
- `scaling` is the per-stat value from `statScaling`

This matches confirmed in-game and CN wiki breakpoint tables, including the previously disputed Pollux and Wanda ATK values.

### Substats

Substat growth is modeled separately in `substatScaling`.

Rules:
- Secondary stat baselines start from the canonical Lv. 1 defaults
- Each `substatScaling` value is applied once at Lv. 10, 20, 30, 40, 50, and 60
- Growth stops after Lv. 60 for normal level scaling
- Psyche Surge duplicate bonuses add the same `substatScaling` step again for each `E3+N` level

The resolver is:

```ts
levelSteps = min(floor(level / 10), 6)
substat(level, psycheSurgeOffset) =
  levelOneBaseline + levelSteps * scaling + psycheSurgeOffset * scaling
```

Equivalent Lv. 60 anchored form used by the resolver:

```ts
substat(level, psycheSurgeOffset) =
  statAt60 - (6 - levelSteps) * scaling + psycheSurgeOffset * scaling
```

Example:
- Kathigu-Ra `CritRate` baseline is `5%`, `substatScaling.CritRate` is `0.8%`
- Lv. 60: `5 + (6 * 0.8) = 9.8%`
- Lv. 60 at `E3+2`: `9.8 + (2 * 0.8) = 11.4%`

So the database stores canonical Lv. 60 substat values in `stats`, then rewinds or advances from there.

## Why The Old Note Was Wrong

The earlier note assumed:
- hidden decimal base values
- floor-based interpolation from sparse samples
- inability to infer exact level curves from the stored data

That turned out to be a bad model. Once the limited vs non-limited base split was identified and verified, the exact formula became straightforward and deterministic.

## Data Shape

Current schema in `src/data/awakeners-full.json`:

```ts
{
  "stats": {
    "CON": "140",
    "ATK": "158",
    "DEF": "131"
  },
  "primaryScalingBase": 30,
  "statScaling": {
    "CON": 1.65,
    "ATK": 1.75,
    "DEF": 1.45
  },
  "substatScaling": {
    "RealmMastery": 4
  }
}
```

## Validation Notes

- All 55 awakeners currently in `awakeners-full.json` align with the local Lv. 60 audit note in `docs/notes/Stat scaling.md`
- The only stale source values were:
  - Wanda ATK scaling and Lv. 60 ATK
  - Pollux ATK scaling and Lv. 60 ATK
- Clementine's sheet scaling was correct; the bad values had been in our local Lv. 60 data

## User-Facing Outcome

The database detail modal now:
- lets the user choose awakener level from Lv. 1 to Lv. 90
- recalculates displayed CON / ATK / DEF from the exact formula
- feeds those leveled stats into the existing rich-text damage math
- shows level-scaling substats without embedding noisy growth text directly in the value string
- models Psyche Surge duplicate bonuses through the `E3+N` stepper in the attributes panel

## Remaining Scope

The core level-scaling work is done. Future follow-up, if wanted:
- add explicit database share links for specific level states
- extend the same pattern to future database branches if wheels or other units need level-aware displays
