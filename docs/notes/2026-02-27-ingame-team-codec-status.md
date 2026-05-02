# In-Game Team Codec Status

Last updated: 2026-05-02

## Goal
Support Morimens in-game team codes (`@@...@@`) alongside the stable SKeyDB `t1.` / `mt1.` import-export codec, without destabilizing the current builder flow.

## Implemented
- In-game team decode support lives in `src/domain/ingame-codec.ts`.
- Import auto-detect now supports:
  - `t1.`
  - `mt1.`
  - wrapped in-game `@@...@@` codes
  - full pasted in-game share blocks where the `@@...@@` code is embedded in surrounding text
- Builder now exposes a separate `Export In-Game` action for single-team export.
- In-game import/export stays separate from the existing compact SKeyDB codec.
- `t1.` and `mt1.` remain supported through frozen codec tables so website-native compact codes survive future normalized ID changes.
- Token dictionaries are built from public V2 `lineupToken` fields on awakeners, wheels, covenants, and posses.
- Dictionary validation and codec coverage tests were added for:
  - token collisions
  - canonical data coverage
  - observed sample decode/encode ordering
  - import auto-detection behavior
- Unknown awakener and wheel tokens import safely as empty and surface a warning to the user.
- Current in-game dialog copy clearly marks the feature as work in progress.
- `@@...@@` in-game token coverage is still WIP and not guaranteed for unsupported slices.

## Current Behavior
### Import
- Users can paste either the raw `@@...@@` code or the full copied in-game text block.
- Import remains permissive when structure is recoverable.
- Unknown awakeners and wheels are dropped to empty instead of failing the entire import.
- Builder surfaces a warning toast when unsupported awakener/wheel tokens are encountered.
- Covenant and posse sections decode through public V2 `lineupToken` fields.

### Export
- In-game export is single-team only in the current release.
- Export output is wrapped as `@@<payload>@@`.
- Covenant and posse export uses public V2 `lineupToken` fields.

## Current priority framing

- The builder and compact SKeyDB codecs are already treated as shipped foundation; the in-game codec now depends on public V2 token coverage rather than local token tables.

## Locked Data/Ownership Decisions
- In-game codec logic stays outside `src/domain/import-export.ts` except for wrapper integration.
- Reverse-engineered transport tokens are public V2 `lineupToken` metadata.
- Runtime lookup tables are derived from public V2 lite records.
- Parser/encoder contract already reserves all 4 blocks:
  - awakeners
  - wheels
  - covenants
  - posses

## Data Contract Note
- Posses use public V2 `posse-####` ids as dictionary identity.

## Remaining Work
### Medium priority
- Refresh observed sample fixtures when game updates change token payloads.
- Add more observed sample fixtures as regression coverage for future game updates.

### Low priority
- Improve builder UX around in-game import/export wording as confidence grows.
- Consider a small developer-facing diagnostics view if reverse-engineering churn continues.

## Current Known Limitations
- Future game content can still introduce new unknown tokens, which will import permissively as empty until mapped.
- `@@...@@` compatibility depends on public V2 `lineupToken` coverage staying current.

## Files
- `src/domain/ingame-codec.ts`
- `src/domain/ingame-token-dictionaries.ts`
- `src/domain/ingame-codec.test.ts`
- `src/domain/ingame-token-dictionaries.test.ts`
- `src/domain/import-export.ts`
- `src/domain/import-export.test.ts`
- `src/pages/builder/useBuilderImportExport.ts`
- `src/pages/builder/BuilderImportExportDialogs.tsx`

## Status
- Phase A: public V2 token ingestion and validation tooling - done
- Phase B: decode path and import auto-detect - done
- Phase C: single-team WIP-safe export path - done
- Phase D: covenant/posse completion - done
- Compact `t1.` / `mt1.` codec compatibility - frozen and supported
