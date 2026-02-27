# In-Game Team Codec Status

Last updated: 2026-02-27

## Goal
Support Morimens in-game team codes (`@@...@@`) alongside the existing SKeyDB `t1.` / `mt1.` import-export codec, without destabilizing the current builder flow.

## Implemented
- In-game team decode support lives in `src/domain/ingame-codec.ts`.
- Import auto-detect now supports:
  - `t1.`
  - `mt1.`
  - wrapped in-game `@@...@@` codes
  - full pasted in-game share blocks where the `@@...@@` code is embedded in surrounding text
- Builder now exposes a separate `Export In-Game` action for single-team export.
- In-game import/export stays separate from the existing compact SKeyDB codec.
- Token dictionaries are tracked separately from canonical data in:
  - `src/data/ingame-tokens/awakeners.json`
  - `src/data/ingame-tokens/wheels.json`
  - `src/data/ingame-tokens/covenants.json`
  - `src/data/ingame-tokens/posses.json`
- Dictionary validation and codec coverage tests were added for:
  - token collisions
  - canonical data coverage
  - observed sample decode/encode ordering
  - import auto-detection behavior
- Unknown awakener and wheel tokens import safely as empty and surface a warning to the user.
- Current in-game dialog copy clearly marks the feature as work in progress.

## Current Behavior
### Import
- Users can paste either the raw `@@...@@` code or the full copied in-game text block.
- Import remains permissive when structure is recoverable.
- Unknown awakeners and wheels are dropped to empty instead of failing the entire import.
- Builder surfaces a warning toast when unsupported awakener/wheel tokens are encountered.
- Covenant and posse sections are currently parsed as unsupported/WIP and intentionally import as empty.

### Export
- In-game export is single-team only in the current release.
- Export output is wrapped as `@@<payload>@@`.
- Unsupported covenant and posse data currently normalize to empty placeholders.
- Export dialog warns that covenant and posse support is not complete yet.

## Locked Data/Ownership Decisions
- In-game codec logic stays outside `src/domain/import-export.ts` except for wrapper integration.
- Reverse-engineered transport tokens stay in dedicated token dictionary files, not in `*-lite.json`.
- Runtime lookup tables are built from the split tracked dictionaries.
- Parser/encoder contract already reserves all 4 blocks:
  - awakeners
  - wheels
  - covenants
  - posses

## Data Contract Note
- Posses currently use the repo's canonical slug `id` as dictionary identity, not the numeric `index` field.
- This is consistent with the current app data contract, even though it is less uniform than awakeners/wheels.
- A posse identity migration is intentionally deferred because it would touch persistence, builder state, collection state, search, and import/export behavior well beyond the current in-game codec scope.

## Remaining Work
### High priority
- Add real covenant token coverage and wire covenant decode/encode.
- Add real posse token coverage and wire posse decode/encode.
- Remove WIP fallback behavior once covenant/posse coverage is complete.

### Medium priority
- Expand diagnostics once covenant/posse support lands so those warnings can surface in UI too.
- Add more observed sample fixtures as regression coverage for future game updates.

### Low priority
- Improve builder UX around in-game import/export wording once the feature graduates from WIP.
- Consider a small developer-facing diagnostics view if reverse-engineering churn continues.

## Current Known Limitations
- Covenant slices are not fully supported yet.
- Posse import/export is not fully supported yet.
- Future game content can still introduce new unknown tokens, which will import permissively as empty until mapped.

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
- Phase A: token ingestion and validation tooling - done
- Phase B: decode path and import auto-detect - done
- Phase C: single-team WIP-safe export path - done
- Phase D: covenant/posse completion - remaining
