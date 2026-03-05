# Awakener Stat Scaling Analysis

**Status:** Feasible but blocked on data availability  
**Date:** 2026-03-05  
**Context:** Investigation into dynamic level 1-90 stat calculation for awakener CON/ATK/DEF

## Summary

A consistent mathematical formula exists for computing awakener stats at any level (1-90), but implementing a level slider requires additional data not currently in the codebase.

## Current State

- **JSON data level:** Level 60 (confirmed via sample matching: xu, liz, thais, ogier, murphy: fauxborn)
- **Math interpretations:** Already implemented and working correctly at level 60
  - Displays computed values for %ATK/%DEF/%CON scaling in skill descriptions
  - Example: `14% ATK DMG` → `14% ATK DMG (13)` where 13 = round(0.14 × 92)

## The Formula

```javascript
stat(level) = Math.floor(true_base + (level - 1) * growth_rate)
```

Where:
- `true_base` = hidden decimal offset (e.g., 70.5 for a character showing 70 at level 1)
- `growth_rate` = `(stat_L90 - stat_L1) / 89`
- Rounding method is **consistently `floor`** across all tested characters

### Why Simple Approaches Fail

Both `Math.round(stat1 + ...)` and `Math.floor(stat1 + ...)` produce ±1 errors because they assume `true_base = stat1` (an exact integer). The actual base has a hidden decimal offset that varies per character/stat.

### Accuracy with Both Endpoints

When both level 1 and level 90 stats are known:
```javascript
stat(level) = Math.round(stat1 + (level - 1) * (stat90 - stat1) / 89)
```

**Maximum error:** ±1 across all levels (verified against sample data)

## Growth Rate Patterns

Two distinct growth groups emerged from sample data:

| Group | Characters | L90/L60 ratio | L1/L60 ratio |
|-------|-----------|---------------|--------------|
| A | xu, thais, murphy | ~1.33 | ~0.345 |
| B | liz, ogier | ~1.38 | ~0.267 |

**Problem:** No observable property (rarity, stat total, stat distribution) cleanly separates these groups. Cannot reverse-engineer L1/L90 from L60 alone.

## What's Required for Level Slider

### Data Needed

Add **one additional level** (either L1 or L90) to `awakeners-full.json` for each awakener:

```typescript
// Example schema addition
{
  "id": "xu",
  "stats": {
    "CON": "203",  // current L60
    "ATK": "122",
    "DEF": "113"
  },
  "statsL1": {     // NEW: add this
    "CON": "70",
    "ATK": "42",
    "DEF": "39"
  }
  // OR statsL90 instead
}
```

**Data volume:** 54 awakeners × 3 stats = 162 values

### Implementation Effort

Once data is available:
1. Update `awakeners-full.ts` schema to include L1 or L90 stats
2. Add level slider component (1-90 range, default to 60)
3. Update stat display to compute from slider value
4. Update math interpretations to use slider-computed stats instead of fixed L60

**Estimated complexity:** Low (2-3 hours) — the formula is proven, just needs data and UI wiring

## Data Source Constraints

**Known source:** Chinese wiki with full level 1-90 data per character

**Blockers:**
- Anti-scraping protection (no robots allowed)
- Data is per-character page (not bulk exportable)
- Would require manual click-through for each of 54 characters

**Manual collection effort:** ~30-60 minutes of copy-paste work per level tier (L1 or L90)

## Sample Data Reference

Verified sample characters (level 60 → level 90):

| Character | Rarity | CON | ATK | DEF |
|-----------|--------|-----|-----|-----|
| xu | SSR | 203→270 | 122→162 | 113→150 |
| liz | SSR | 108→149 | 148→204 | 116→160 |
| thais | SSR | 140→186 | 135→180 | 126→168 |
| ogier | SR | 136→187 | 116→160 | 148→204 |
| murphy: fauxborn | Genesis | 99→132 | 122→162 | 117→156 |

Full sample data with all 10 level checkpoints stored in `untracked/mathematics.txt`.

## Recommendation

**Priority:** Low / Nice-to-have

**Rationale:**
- Current L60 stats + math interpretations already provide accurate skill damage calculations
- Level slider adds planning flexibility but not critical functionality
- Data collection effort is manual and time-consuming
- Formula is proven and ready to implement when/if data becomes available

**If pursued:** Collect L90 stats (easier to verify in-game at max level) rather than L1 stats.
