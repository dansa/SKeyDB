# Oxfmt replacement assessment

Date: 2026-07-10

## Recommendation

Migrate this repository from Prettier to Oxfmt now, in one controlled formatting commit. Use native Oxfmt import and Tailwind sorting, remove the two Prettier plugins and the direct Prettier dependency, and do not retain a compatibility sidecar.

The fit is good because every format in the repository's enforced scope is supported, the current plugin responsibilities have native Oxfmt equivalents, the actual diff is small, and an isolated migration passed the complete repository verification suite. The main caveat is maturity: Oxfmt is still explicitly a beta and its current release is `0.58.0`, so it should be pinned exactly and upgraded deliberately rather than with a range. The latest combined Oxc release was published on 2026-07-06. [Oxfmt beta announcement](https://oxc.rs/blog/2026-02-24-oxfmt-beta), [Oxc release `apps_v1.73.0` / Oxfmt `0.58.0`](https://github.com/oxc-project/oxc/releases/tag/apps_v1.73.0)

## Implementation outcome

The migration was completed on the same day as this assessment. MomenTB now uses exact-pinned `oxfmt@0.58.0`, native import sorting, native Tailwind v4 sorting with `src/index.css`, and an explicit JSON width override. The direct Prettier dependency, both Prettier plugins, the Prettier config, and `.prettierignore` were removed without adding a compatibility sidecar.

The staged-file harness now formats Git index contents through Oxfmt's stdin interface and compares the result byte-for-byte. A regression probe confirmed that it rejects an unformatted staged blob even when the working-tree copy is already formatted, then passes after the formatted blob is restaged. The final repository verification passed Oxfmt over 822 files, native Oxlint, React Doctor with no new diagnostics, all 1,744 tests, script and asset checks, TypeScript 7, and the production build.

This would remove the project's direct Prettier dependency, not every internal use of Prettier inside the `oxfmt` package. Oxfmt formats JS/TS, JSON, and CSS natively, but currently delegates formats including YAML to a bundled Prettier implementation. The repository has three workflow YAML files, so those files would take that internal path without requiring a separately configured project dependency or plugin. [Oxfmt language support](https://oxc.rs/docs/guide/usage/formatter/language-support)

## Current repository contract

The current configuration uses:

- Prettier `3.9.5`, with the repository's usual `semi: false`, single quotes, 100-column source width, and 160-column JSON override.
- `@ianvs/prettier-plugin-sort-imports` for React, built-in, third-party, `@/`, relative, and stylesheet import groups.
- `prettier-plugin-tailwindcss` for class ordering.
- `.prettierignore` to exclude Markdown, lockfiles, build output, and generated public-v2/public-v3 data while selectively re-including owned JSON.
- A custom staged-file script that checks the Git index contents rather than merely checking the working-tree copies.

The enforced target set is predominantly 717 TypeScript/TSX files, plus 15 CSS files, eight scripts, owned JSON/config files, and three GitHub Actions YAML files. The existing Prettier format check measured about 6.8–7.7 seconds locally.

Prettier remains the conservative choice in general when exact third-party plugin behavior is required. Oxfmt's own migration guidance says the same, and notes that its closest stated compatibility target is Prettier 3.8 even though newer releases have continued aligning with Prettier 3.9 behavior. [Oxfmt migration guide](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier), [Oxfmt `0.58.0` release notes](https://github.com/oxc-project/oxc/releases/tag/apps_v1.73.0), [Prettier 3.9 announcement](https://prettier.io/blog/2026/06/27/3.9.0)

## Coverage comparison

| Requirement | Current Prettier stack | Oxfmt `0.58.0` | Assessment |
| --- | --- | --- | --- |
| JS, JSX, TS, TSX | Prettier core | Native Rust formatter | Covered; Oxfmt reports full JS/TS Prettier conformance and treats remaining differences as bugs. |
| CSS | Prettier core | Native Rust formatter | Covered. The current release specifically includes CSS/SCSS alignment work against Prettier 3.9.1. |
| JSON/JSONC | Prettier core | Native Rust formatter | Covered, including file overrides. Disable Oxfmt's default `sortPackageJson` to retain current key ordering. |
| GitHub workflow YAML | Prettier core | Bundled Prettier-backed formatter | Covered, but not a pure-Rust path. |
| Import sorting | IanVS plugin | Native `sortImports`, based on `eslint-plugin-perfectionist` | Functionally covered, with one side-effect-barrier difference described below. |
| Tailwind class sorting | Official Tailwind Prettier plugin | Native `sortTailwindcss`, based on the same Tailwind algorithm | Covered; no class-order diff was found in the repository probe. |
| Ignore files | `.prettierignore` | `.gitignore`, `.prettierignore`, CLI ignore paths, or config `ignorePatterns` | Covered; move the owned rules into config and remove the legacy file after validation. |
| JSON 160-column override | Prettier override | Oxfmt override | Covered, but the automatic migrator does not currently copy overrides. |
| CI check/write/list | `--check`, `--write`, `--list-different` | Same workflow and closely corresponding flags | Covered. |
| Staged index-content check | Prettier JS API (`getFileInfo`, `resolveConfig`, `check`) | CLI stdin or `format(fileName, sourceText, options)` | Covered with a small harness rewrite; it is not a drop-in API rename. |
| Editor format-on-save | Prettier editor plugins | Official Oxc extension/LSP and integrations for VS Code, Zed, JetBrains, and Neovim | Covered; the project currently commits no `.vscode` settings. |

Sources: [Oxfmt overview and compatibility claim](https://oxc.rs/docs/guide/usage/formatter), [language support](https://oxc.rs/docs/guide/usage/formatter/language-support), [configuration reference](https://oxc.rs/docs/guide/usage/formatter/config-file-reference), [ignore semantics](https://oxc.rs/docs/guide/usage/formatter/ignore-files), [CLI reference](https://oxc.rs/docs/guide/usage/formatter/cli), [editor integration](https://oxc.rs/docs/guide/usage/formatter/editors), [Oxfmt JavaScript API source](https://github.com/oxc-project/oxc/blob/main/apps/oxfmt/src-js/index.ts)

## Plugin equivalence

### Import sorting

Oxfmt can express the repository's visible grouping contract with `customGroups`, `groups`, `newlinesBetween`, `ignoreCase`, and the built-in selectors for built-ins, external packages, internal aliases, relatives, and styles. Its native sorter removes the stale `importOrderTypeScriptVersion: "5.9.3"` setting; Oxfmt's formatter does not peer-depend on the installed TypeScript compiler and therefore does not block TypeScript 7. [Oxfmt sorting reference](https://oxc.rs/docs/guide/usage/formatter/sorting), [Oxfmt configuration reference](https://oxc.rs/docs/guide/usage/formatter/config-file-reference)

It is not algorithmically identical to the IanVS plugin. IanVS deliberately treats side-effect-only imports as barriers that other imports cannot cross. Oxfmt's `sortSideEffects: false` leaves side-effect imports themselves unsorted, but the repository probe showed ordinary imports can still move across a stylesheet side-effect import. The repository has seven side-effect stylesheet imports; the proposed Oxfmt grouping changed import ordering or adjacent blank lines in nine files. Those nine diffs are small enough to review directly, and no behavior regression appeared in the full test/build run, so this is an acceptable migration difference rather than a reason to retain the plugin. [IanVS side-effect semantics](https://github.com/IanVS/prettier-plugin-sort-imports#how-does-import-sort-work), [Oxfmt `sortSideEffects` reference](https://oxc.rs/docs/guide/usage/formatter/config-file-reference#sortimportssortsideeffects)

The automatic `oxfmt --migrate=prettier` command is only a starting point here. Its current implementation recognizes the Tailwind plugin but warns and skips other plugin strings, so it does not convert `@ianvs/prettier-plugin-sort-imports`. It also documents that Prettier overrides are not automatically migrated. The import groups and JSON override therefore need manual translation, and the leftover `importOrder*` keys must not be carried into the final config. [Oxfmt migration implementation](https://github.com/oxc-project/oxc/blob/main/apps/oxfmt/src-js/cli/migration/migrate-prettier.ts)

### Tailwind sorting

Oxfmt says its native Tailwind sorter uses the same algorithm as `prettier-plugin-tailwindcss` and supports the relevant v4 `stylesheet` setting. The production config should explicitly use `stylesheet: "./src/index.css"`. This is slightly stronger than the current Prettier configuration: Tailwind's official plugin documentation says a v4 project must specify its stylesheet, but the repository currently does not. Neither stack is configured to sort strings passed to `clsx`, so enabling such function sorting would be a separate policy change and should not be folded into this migration. [Oxfmt Tailwind sorting](https://oxc.rs/docs/guide/usage/formatter/sorting#sort-tailwind-css-classes), [official Tailwind Prettier plugin options](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#specifying-your-tailwind-stylesheet-path-tailwind-css-v4)

## Empirical repository probe

An isolated Oxfmt `0.58.0` migration was run against the current clean source set with the manually translated import groups, explicit Tailwind v4 stylesheet, JSON override, and current ignore boundary.

Results:

- 821 files formatted in about 361 ms; a warm local check was about 0.13 seconds, versus about 7.69 seconds for the current Prettier check.
- 22 files changed, totaling 60 inserted and 37 deleted lines.
- 13 files had core formatter differences. These were layout-only choices, principally long TypeScript unions becoming one member per line and one callback wrapping difference.
- Nine files had native import-order or blank-line differences attributable to the different sorter/side-effect model.
- No Tailwind class-order differences were found.
- Oxlint passed.
- All 234 Vitest files and all 1,744 tests passed.
- The TypeScript 7 production build passed.

This is an acceptably small, reviewable reformat. It also demonstrates that TypeScript 7 is not an integration obstacle for Oxfmt in this repository.

## Integration details that matter

1. Pin `oxfmt` exactly to `0.58.0`. Oxfmt remains beta and publishes frequent `0.x` releases; intentional upgrades should run a format diff and the full verification suite. Prettier itself also recommends exact formatter pins to prevent unreviewed output changes. [Oxfmt beta announcement](https://oxc.rs/blog/2026-02-24-oxfmt-beta), [Prettier 3.9 announcement](https://prettier.io/blog/2026/06/27/3.9.0)
2. Use `.oxfmtrc.json` or `oxfmt.config.ts` with all current core options written explicitly, `sortPackageJson: false`, native import groups, native Tailwind sorting, the JSON override, and the generated-data ignore rules. Oxfmt supports both config formats and a schema. [Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config)
3. Keep the generated public-v2/public-v3 exclusions. Lockfiles are always ignored by Oxfmt, but retaining the explicit producer-owned boundary makes repository intent clear. Oxfmt's config `ignorePatterns` use gitignore syntax and are scoped to the config location. [Oxfmt ignore files](https://oxc.rs/docs/guide/usage/formatter/ignore-files)
4. Rewrite `scripts/format-changed-files.mjs` rather than weakening the pre-commit contract. The current hook validates the staged blob, which matters when a file has both staged and unstaged edits. Oxfmt exposes `--stdin-filepath` and a `format(fileName, sourceText, options)` API; either can format the index text for a byte comparison without keeping Prettier. The public JavaScript API currently exports formatting, not Prettier-style `resolveConfig`, `getFileInfo`, or `check`, so target/ignore handling must remain explicit in the harness. [Oxfmt CLI](https://oxc.rs/docs/guide/usage/formatter/cli), [Oxfmt API source](https://github.com/oxc-project/oxc/blob/main/apps/oxfmt/src-js/index.ts)
5. Remove `prettier`, `@ianvs/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`, `prettier.config.cjs`, and `.prettierignore` only after the native config and staged check have passed. Oxfmt does not load arbitrary Prettier plugins; its built-ins are the intended replacements. [Unsupported Oxfmt features](https://oxc.rs/docs/guide/usage/formatter/unsupported-features)
6. Do not add another formatter sidecar. The only non-native language path in this repository is Oxfmt's own bundled YAML fallback, which is transparent to project scripts and dependency management.

## Bottom line

This migration is lower-risk than the ESLint-to-Oxlint move. There is no meaningful TypeScript 7 coupling, no missing repository language, no Tailwind behavior gap in the measured source, and only 22 reviewable formatting changes. The correct posture is **adopt now, exact-pin while beta, and manually translate the import contract and JSON override**.
