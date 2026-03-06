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
      - `src/components/ui/OwnedTogglePill.tsx`
      - `src/components/ui/Toast.tsx`
      - `src/pages/builder/constants.ts`
      - `src/components/ui/ModalFrame.tsx`
      - `src/components/ui/PanelSection.tsx`
      - `src/components/ui/Button.tsx`
      - `src/components/ui/ImportStrategyDialog.tsx`
      - `src/pages/builder/useGlobalPickerSearchCapture.ts`
      - `src/components/ui/ExportCodeDialog.tsx`
      - `src/components/ui/ConfirmDialog.tsx`
      - `src/components/ui/CollectionSortControls.tsx`
      - `src/components/ui/TogglePill.tsx`
      - `src/domain/posses.ts`
      - `src/pages/collection/CollectionLevelStepButton.tsx`
      - `src/components/ui/DupeLevelDisplay.tsx`
      - `src/components/ui/ImportCodeDialog.tsx`
      - `src/components/ui/TabbedContainer.tsx`
      - `src/components/ui/useTimedToast.ts`
      - `src/pages/builder/BuilderTransferConfirmDialog.tsx`
      - `src/domain/collection-sorting.ts`
      - `src/domain/team-rules.ts`
      - `src/domain/collection-ownership.ts`
    - Intentional current-branch divergences rather than missed salvage:
      - `vite.config.ts` uses the explicit `@` alias wiring instead of the PR's `vite-tsconfig-paths` plugin.
      - `src/main.tsx` is simplified around the required root mount point and does not indicate unsalvaged PR behavior by itself.
      - `src/domain/wheel-mainstat-filters.ts` is intentionally consolidated around `MAINSTAT_ICON_BY_ID` from `mainstats.ts` instead of duplicating icon imports locally.
      - `src/domain/awakeners-search.ts` is intentionally stronger on the current branch because it searches tags and uses different Fuse weighting, so it should be reviewed as a current-branch divergence rather than blindly backported from PR #14.
      - `src/domain/awakener-assets.ts` is intentionally stronger on the current branch because it trims repeated leading and trailing slug hyphens in one step.
      - `src/domain/factions.ts` is intentionally stronger on the current branch because it adds `REALM_TINT_BY_LABEL` and keeps the realm/faction compatibility helpers centralized.
      - `src/domain/mainstats.ts` is intentionally stronger on the current branch because it centralizes mainstat icon lookup and exports `getMainstatIcon` and `MAINSTAT_ICON_BY_ID`.
      - `src/pages/home/changelog.ts` has newer branch-local entries and should not be treated as a missed PR salvage item.
  - Core builder import/export cluster findings:
    - Behavior-equivalent or refactor-only:
      - `src/pages/builder/team-collection.ts`
      - `src/pages/builder/transfer-resolution.ts`
      - `src/pages/builder/import-planner.ts`
    - Intentional current-branch strictness or safety improvements:
      - `src/domain/import-export.ts` adds explicit multi-team active-index bounds checking and verifies trailing-data exhaustion after multi-team decode instead of relying only on computed length checks.
      - `src/pages/builder/useBuilderImportExport.ts` safely falls back when `pendingReplaceImport.activeTeamIndex` is out of range instead of assuming the index is always valid.
  - Core domain and builder-state cluster findings:
    - Behavior-equivalent or refactor-only:
      - `src/domain/ingame-token-dictionaries.ts`
      - `src/pages/builder/team-state.ts`
    - Intentional current-branch strictness or capability improvements:
      - `src/domain/awakeners.ts` is intentionally stronger on the current branch because it validates unique `ingameId` values and carries richer lite metadata (`type`, `stats`, `tags`, `unreleased`) used by newer features.
      - `src/domain/ingame-codec.ts` is intentionally stronger on the current branch because it throws when the posse token is missing and uses slightly more defensive wheel-token handling during decode.
      - `src/pages/builder/useBuilderViewModel.ts` is intentionally safer on the current branch because it guards `startQuickLineup` against a missing active team and removes the unreachable `-1` quick-lineup step branch.
  - Large builder/page orchestration slice findings:
    - Behavior-equivalent or refactor-only:
      - `src/pages/BuilderPage.tsx`
      - `src/pages/builder/BuilderActiveTeamPanel.tsx`
      - `src/pages/builder/BuilderSelectionPanel.tsx`
      - `src/pages/builder/BuilderTeamsPanel.tsx`
      - `src/pages/builder/BuilderTeamRow.tsx`
    - Notes:
      - `src/pages/BuilderPage.tsx` inlines the posse-selection flow and drag-overlay rendering that PR #14 kept behind small helpers, but the resulting behavior matches the current builder semantics.
      - `src/pages/builder/BuilderSelectionPanel.tsx` inlines picker-zone subcomponents from the PR version without changing filter, ownership, duplicate, or blocked-state behavior.
      - `src/pages/builder/BuilderActiveTeamPanel.tsx` reshapes `AwakenerCard` props to the current component API, but the quick-lineup controls and owned-level display logic remain equivalent.
  - Collection page orchestration findings:
    - Behavior-equivalent or refactor-only:
      - `src/pages/CollectionPage.tsx`
    - Notes:
      - `src/pages/CollectionPage.tsx` and the PR version differ mostly in whether navigation panels, batch-action panels, and per-tab grid renderers are extracted into local helper components, but the ownership toggles, batch actions, import/export flow, and card wheel interactions remain aligned.
  - Database and top-level page orchestration findings:
    - Behavior-equivalent or refactor-only:
      - `src/pages/CharactersPage.tsx`
    - Intentional current-branch divergences or newer branch-local additions:
      - `src/pages/DatabasePage.tsx` is a current-branch addition rather than a missed PR #14 salvage item.
      - `src/pages/database/useDatabaseViewModel.ts` is a current-branch addition that supports the newer database page flow rather than an unsalvaged PR file.
      - `src/pages/HomePage.tsx` differs mostly in local presentation copy, card helper naming, and newer branch-local content rather than missed runtime logic from PR #14.
  - Database detail cluster findings:
    - Intentional current-branch additions rather than missed PR #14 salvage:
      - `src/pages/database/AwakenerDetailModal.tsx`
      - `src/pages/database/AwakenerDetailOverview.tsx`
      - `src/pages/database/AwakenerDetailSidebar.tsx`
      - `src/pages/database/AwakenerDetailCards.tsx`
      - `src/pages/database/AwakenerGuideTab.tsx`
      - `src/pages/database/AwakenerTeamsTab.tsx`
      - `src/pages/database/DatabaseFilters.tsx`
      - `src/pages/database/DatabaseGrid.tsx`
      - `src/pages/database/RichDescription.tsx`
      - `src/pages/database/RichSegmentRenderer.tsx`
      - `src/pages/database/SkillPopover.tsx`
      - `src/pages/database/TagPopover.tsx`
      - `src/pages/database/PopoverTrailPanel.tsx`
      - `src/pages/database/popover-trail.ts`
      - `src/pages/database/font-scale.ts`
      - `src/pages/database/text-styles.ts`
    - Notes:
      - The `src/pages/database/*` detail stack is absent from PR commit `558178b` and should be treated as post-PR branch evolution, not an unsalvaged semantic slice to port back in.

## Implications

- PR #14 salvage cannot be considered complete yet.
- The remaining review must happen file-by-file or feature-slice-by-feature-slice against the squashed PR commit, not by commit identity.
- The next useful reduction step is to keep burning down the low-delta runtime queue, marking files as mechanical-only, intentionally superseded, or logic-different before touching the largest builder and collection files.

## Follow-up links

- Plan: `docs/plans/2026-03-06-pr14-salvage-plan.md`
- Roadmap: `docs/roadmap.md`
- Related note: `docs/notes/2026-03-06-pr14-single-commit-audit.md`
