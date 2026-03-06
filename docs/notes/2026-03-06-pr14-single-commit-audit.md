# PR #14 Single-Commit Audit Note

Last updated: 2026-03-06

## Why this exists

- Preserve the finding that PR #14 was delivered as a single squashed commit, so commit-level equivalence is not enough to prove semantic salvage coverage.
- Record the first-pass classification of the PR diff against `pr14-salvage` after the tooling groundwork landed.

## Current state

- `pr14-reference` points at the PR head commit `558178b`.
- `pr14-salvage` contains the tooling, Prettier, alias, and repo-wide import rewrite groundwork.
- `git cherry -v pr14-salvage pr14-reference` is insufficient on its own because the PR content is squashed into one commit.
- A file-by-file comparison is still required to separate mechanical churn from behavior changes.

## Key decisions or observations

- First-pass normalized audit results for the squashed PR commit against the current branch:
  - `157` files are still `ast_different`
  - `4` files are `ast_equivalent`
  - `1` file needs `css_manual_review`
  - `2` files are `missing_or_deleted`
  - `5` files are `json_ignored`
- Files confidently matched after AST normalization:
  - `src/domain/awakener-identity.ts`
  - `src/domain/name-format.ts`
  - `src/domain/storage.ts`
  - `src/test/setup.ts`
- Files intentionally ignored for this salvage audit pass:
  - `package.json`
  - `tsconfig.app.json`
  - `src/data/awakeners-full.json`
  - `src/data/awakeners-lite.json`
  - `src/data/mainstats.json`
- Files requiring special manual handling outside the TS/TSX AST pass:
  - `src/index.css`
  - `src/pages/BuilderPage.awakeners-teams.test.tsx`
  - `src/pages/BuilderPage.wheels-covenants.test.tsx`
- The unresolved review surface still spans `ui`, `domain`, `builder`, `collection`, `page_shells`, and remaining tooling files.
- Reviewed low-delta batch findings:
  - Mechanical-only or behavior-equivalent so far:
    - `src/pages/builder/wheel-mainstats.ts`
    - `src/pages/collection/OwnershipLevelDisplay.tsx`
    - `src/domain/covenant-assets.ts`
    - `src/domain/posse-assets.ts`
    - `src/domain/wheel-assets.ts`
    - `src/pages/builder/PickerDropZone.tsx`
    - `src/domain/covenants.ts`
    - `src/domain/wheel-sort.ts`
    - `src/components/ui/PageToolkitBar.tsx`
    - `src/pages/collection/CollectionLevelControls.tsx`
    - `src/pages/builder/team-validation.ts`
    - `src/pages/collection/useOwnedAwakenerBoxEntries.ts`
    - `src/pages/collection/useOwnedWheelBoxEntries.ts`
    - `src/components/ui/SegmentedControl.tsx`
    - `src/domain/wheels.ts`
    - `src/domain/posses-search.ts`
    - `src/pages/builder/usePendingResetTeamDialog.ts`
    - `src/pages/collection/useGlobalCollectionSearchCapture.ts`
  - Intentional current-branch divergences rather than missed salvage:
    - `vite.config.ts` uses the explicit `@` alias wiring instead of the PR's `vite-tsconfig-paths` plugin.
    - `src/main.tsx` is simplified around the required root mount point and does not indicate unsalvaged PR behavior by itself.
    - `src/domain/wheel-mainstat-filters.ts` is intentionally consolidated around `MAINSTAT_ICON_BY_ID` from `mainstats.ts` instead of duplicating icon imports locally.
    - `src/domain/awakeners-search.ts` is intentionally stronger on the current branch because it searches tags and uses different Fuse weighting, so it should be reviewed as a current-branch divergence rather than blindly backported from PR #14.
    - `src/pages/home/changelog.ts` has newer branch-local entries and should not be treated as a missed PR salvage item.

## Implications

- PR #14 salvage cannot be considered complete yet.
- The remaining review must happen file-by-file or feature-slice-by-feature-slice against the squashed PR commit, not by commit identity.
- The next useful reduction step is to keep burning down the low-delta runtime queue, marking files as mechanical-only, intentionally superseded, or logic-different before touching the largest builder and collection files.

## Follow-up links

- Plan: `docs/plans/2026-03-06-pr14-salvage-plan.md`
- Roadmap: `docs/roadmap.md`
- Related note: `docs/notes/2026-03-06-pr14-single-commit-audit.md`
