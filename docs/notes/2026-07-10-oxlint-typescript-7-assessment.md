# Oxlint and TypeScript 7 Assessment

Last updated: 2026-07-10

## Why this exists

This note evaluates whether MomenTB can replace its ESLint stack (including the detached React sidecar) with Oxlint without materially reducing lint coverage, and whether the Oxc stack removes the current TypeScript 7 adoption blocker.

The comparison expands the repo's former ESLint presets and compares their active rules with the official Oxlint rule registry and `tsgolint` implementation list as they stood on 2026-07-10. It records both the disposable evaluation probe and the production migration that followed it.

## Short answer

**Oxlint is sufficient for this repo, and the replacement is now complete.** It has a viable path for essentially all 167 active rules in the former main config, but not all of that coverage is equally mature:

- Core and TypeScript coverage is very strong: 50 of 51 active ESLint-core rules are native, all 40 active syntax-only TypeScript rules are native, and all 48 active type-aware TypeScript rules are implemented by `tsgolint`.
- React Hooks' two foundational rules and React Refresh are native. The other 14 enabled React compiler diagnostics can be covered either by Oxlint's single experimental `react/react-compiler` rule or through the existing `eslint-plugin-react-hooks` package as an alpha JavaScript plugin.
- All eight selected SonarJS rules are present in Oxc's official JS-plugin conformance report under “Fully Passing Rules”, but retaining them means retaining `eslint-plugin-sonarjs` through an alpha compatibility layer.
- Oxlint's native `no-unused-vars` understands TypeScript and JSX and can safely fix unused imports, replacing both `eslint-plugin-unused-imports` rules. The small behavior gap is that the current config gives unused imports error severity and other unused variables warning severity; one native rule cannot preserve that severity split.
- The only active core rule with no native Oxlint rule is `no-octal`. In this repo's ESM/TypeScript-heavy source it is low risk, but it is still a literal coverage difference.

The TypeScript 7 story is the strongest reason to proceed: Oxlint type-aware linting runs directly on `typescript-go`, targets TypeScript 7, and does not rely on TypeScript 6's JavaScript compiler API. [Oxlint's type-aware guide](https://oxc.rs/docs/guide/usage/linter/type-aware.html) and the [official `tsgolint` repository](https://github.com/oxc-project/tsgolint) document this architecture and its 59/61 targeted type-aware rule coverage.

## Implementation outcome

MomenTB now uses exact-pinned `oxlint@1.73.0` and `oxlint-tsgolint@0.24.0` with TypeScript 7.0.2. The committed configuration is native-only: there are no JavaScript lint plugins, no ESLint compatibility bridge, and no detached React sidecar. The native experimental React compiler rule supplements the built-in React, Hooks, Refresh, Import, and type-aware TypeScript rules; React Doctor remains the independent broader React diagnostic pass.

The migration resolved the diagnostics found by the probe rather than suppressing them. It also caught a real React compiler memoization problem in pointer-up cleanup and replaced deprecated/incomplete `MediaQueryList` test objects with an `EventTarget`-backed test primitive. On the completed tree, native lint takes about 1.6 seconds locally, React Doctor reports 100/100, all 1,744 bounded tests pass, TypeScript 7 compiles successfully, and the production build completes. Both packages are pinned because Oxlint explicitly excludes type-aware and experimental rules from normal semantic-version guarantees.

## Current MomenTB lint surface

### Main config

Expanding `eslint.config.js` produces 167 active rules for normal `src` TypeScript/TSX files:

| Source | Active | Oxlint path | Assessment |
| --- | ---: | --- | --- |
| ESLint core | 51 | 50 native | `no-octal` is the sole missing native rule. |
| `typescript-eslint` | 88 | 40 native syntax rules + 48 `tsgolint` rules | All currently enabled rules have an implementation. |
| `eslint-plugin-react-hooks` | 16 | 2 native + 14 through `react/react-compiler` or JS plugin | Functional coverage exists; exact rule-by-rule severity/config parity needs a pilot. |
| React Refresh | 1 | Native `react/only-export-components` | Direct replacement. |
| `import-x` | 1 | Native `import/no-duplicates` | Direct replacement; Oxlint discovers `tsconfig` path aliases itself. |
| SonarJS | 8 | JS plugin | Officially conformance-tested; still alpha plugin infrastructure. |
| `unused-imports` | 2 | Native `eslint/no-unused-vars` | Same intent and import fixes; loses import-vs-variable severity split. |

Oxlint publishes more than 840 built-in rules across ESLint, TypeScript, React, Import, Vitest, JSX accessibility, and other ecosystems. Its [built-in plugin reference](https://oxc.rs/docs/guide/usage/linter/plugins) explicitly treats `import-x` as equivalent to its `import` plugin and combines React, Hooks, and Refresh under the native `react` plugin. The [rules registry](https://oxc.rs/docs/guide/usage/linter/rules) is the source used for the native-name comparison.

The native Import implementation also removes the current resolver packages from the lint path: Oxlint's [multi-file analysis documentation](https://oxc.rs/docs/guide/usage/linter/multi-file-analysis) says it automatically discovers `tsconfig.json` and resolves `compilerOptions.paths`.

### React sidecar

`tools/react-sidecar` expands to 20 active `eslint-plugin-react` rules. Oxlint has 17 with the same native rule name. Of the remaining three:

- `react/jsx-uses-vars` is an adapter rule for ESLint scope analysis; Oxlint's native `no-unused-vars` already recognizes JSX references, so it is not a meaningful missing check.
- `react/prop-types` has no native equivalent. Its value is low for this TypeScript + React 19 codebase, but dropping it is still a policy decision.
- `react/no-deprecated` has no native React equivalent. TypeScript's type-aware `no-deprecated` catches declarations marked deprecated in type metadata, but that is not identical to the React lifecycle-specific rule.

More importantly, the sidecar is currently orphaned: the root `package.json` has no script that executes it, and repo search finds no caller. It currently creates dependency churn without contributing to `npm run lint` or `npm run verify`. A successful Oxlint migration could delete it rather than reproduce it.

## Type-aware linting and TypeScript 7

Oxlint separates syntax linting (Rust) from semantic linting (`tsgolint`, Go). The official guide reports 59 of 61 targeted `typescript-eslint` type-aware rules; the two unchecked rules in the [`tsgolint` implementation list](https://github.com/oxc-project/tsgolint#implemented-rules) are `naming-convention` and `prefer-destructuring`. Neither is enabled by MomenTB. All 48 type-aware rules enabled through MomenTB's strict/stylistic presets are in the implemented list.

That makes Oxlint materially different from a syntax-only replacement. It covers this repo's high-value checks including floating promises, misused promises, unsafe assignment/call/member access/return, unnecessary conditions, `require-await`, restricted operands/templates, and unbound methods.

There are still maturity qualifications:

- Oxlint's [versioning policy](https://oxc.rs/docs/guide/usage/linter/versioning) explicitly excludes both type-aware linting and JavaScript custom plugins from semantic-versioning guarantees.
- The type-aware guide warns about incomplete rule coverage in the broader ecosystem, memory on very large repositories, and TS7-incompatible legacy `tsconfig` options.
- `--type-check` can report compiler diagnostics alongside lint, but the CLI labels that mode experimental. MomenTB should keep `tsc -b` as the build/type-check authority during an initial migration.

### TS7 compatibility specifically

TypeScript 7.0 was released on 2026-07-08. Microsoft's [official release announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) explains the ecosystem break clearly: 7.0 ships the Go-native compiler but no programmatic API; a new API is planned for 7.1. That is why API consumers such as `typescript-eslint` need TypeScript 6 compatibility or a side-by-side alias. It is not merely a slow peer-range update.

Oxc is on the favorable side of that boundary:

- Oxlint's semantic layer runs directly on the native TypeScript implementation and requires TypeScript 7 semantics.
- The Rust Oxc parser supports TS and TSX and reports 99% coverage of Babel and TypeScript parser tests in the [official parser documentation](https://oxc.rs/docs/guide/usage/parser).
- Microsoft states that TypeScript 7 is intended to match TypeScript 6 type-checking/CLI behavior for clean projects, apart from documented removals and default changes.

No Oxc-specific TS7 parser blocker is apparent for this repo. Its configs already use `moduleResolution: "bundler"`, explicitly declare `types`, avoid `baseUrl` and `ignoreDeprecations`, and use scoped project includes/references. The actual TypeScript 7 build probe below confirms that these choices avoid the expected `rootDir`, default, and removed-option failures.

After the source audit, an ephemeral `typescript@7.0.2` invocation ran `tsc -b --pretty false` against the current project references and completed successfully. This establishes that the current source and `tsconfig` graph compile on TypeScript 7; the full test/build pipeline would still be required in an implementation change.

An ephemeral Oxlint 1.73.0 + `oxlint-tsgolint` run also loaded a migrated type-aware configuration and completed analysis of `src`, scripts, and the project config files without a parser or `tsconfig` compatibility failure. It reported twelve adoption diagnostics: three missing browser globals in a Playwright verification script, one intentionally unreachable test path, two Nursery optional-chain suggestions, and six TS7 deprecation diagnostics in test mocks. Those are a small configuration/baseline cleanup, not an Oxc or TS7 blocker. The run took roughly 3.4 seconds including `npx` startup on this machine, versus roughly 35 seconds for the current ESLint command; these are local directional measurements, not controlled benchmarks.

## JavaScript plugin compatibility

Oxlint's JS plugin API targets ESLint v9+ and implements AST traversal, selectors, source/token APIs, scope and control-flow analysis, fixes, options, directives, and editor diagnostics. The official [JS plugin documentation](https://oxc.rs/docs/guide/usage/linter/js-plugins) also names `eslint-plugin-react-hooks` and `eslint-plugin-sonarjs` as conformance-tested plugins.

For this repo:

- The [React Hooks conformance snapshot](https://github.com/oxc-project/oxc/blob/main/apps/oxlint/conformance/snapshots/react-hooks.md) reports all tested rules fully passing and 5007/5021 tests passing, with the remainder skipped.
- The [SonarJS conformance snapshot](https://github.com/oxc-project/oxc/blob/main/apps/oxlint/conformance/snapshots/sonarjs.md) reports 359/360 rules fully passing. All eight rules selected by MomenTB appear in its “Fully Passing Rules” section.
- JS-plugin rules that require TypeScript type information are not supported. MomenTB's type-aware coverage should therefore use native `typescript/*` + `tsgolint`, not the JS `typescript-eslint` plugin.

This bridge is good enough for a parity trial, but relying on it permanently retains some plugin release coupling and accepts an API explicitly marked alpha. The cleanest long-term configuration would use native rules everywhere except SonarJS, then decide whether the eight Sonar checks justify one residual JS plugin.

## Migration and interoperability

The official [ESLint migration guide](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint) supports ESLint 9/10 flat configs through `@oxlint/migrate`. It preserves supported severities/options, overrides, globals, and ignore patterns; `--type-aware` adds the semantic setup; npm JS plugins are migrated by default.

A safe MomenTB evaluation path was:

1. Run `@oxlint/migrate --type-aware` on the current flat config and review the generated config rather than accepting it blindly.
2. Optionally run Oxlint and ESLint side-by-side over the same revision and add small violation fixtures for diagnostics where exact parity matters. This step was deliberately skipped: the user preferred the native stack plus React Doctor over retaining a temporary dual-linter sidecar.
3. Prefer native TypeScript, Import, React foundational rules, Refresh, and unused-import handling. Test both choices for compiler diagnostics: native `react/react-compiler` versus aliased `eslint-plugin-react-hooks` as a JS plugin.
4. Retain SonarJS as a JS plugin for the trial; judge it from actual repo diagnostics before deciding whether to keep it.
5. Explicitly accept or replace the small gaps: `no-octal`, separate unused-import severity, `react/prop-types`, and `react/no-deprecated`.
6. Convert the two existing `eslint-disable react-refresh/only-export-components` comments to Oxlint directives if ESLint is removed.
7. Upgrade and prove TypeScript 7 independently with the full build/test pipeline. Do not make Oxlint's experimental `--type-check` the only type-check gate in the first change.
8. If parity is satisfactory, remove ESLint, `typescript-eslint`, resolver packages, plugin packages no longer used, and the orphaned React sidecar in one coherent cleanup.

## Recommendation

Keep the completed native-only architecture: exact-pinned Oxlint + `oxlint-tsgolint`, native React/Import/TypeScript rules, `tsc -b` as the type-check authority, and React Doctor as the independent React diagnostic pass. This removes the TypeScript compiler-API peer bottleneck without retaining JavaScript lint plugins or a second lint installation. The trade is that type-aware and experimental React compiler rules remain outside Oxlint's semver guarantees, so upgrades should be deliberate and verified rather than automatic.

## Primary sources

- [Oxlint overview](https://oxc.rs/docs/guide/usage/linter)
- [Oxlint rules registry](https://oxc.rs/docs/guide/usage/linter/rules)
- [Oxlint built-in plugins](https://oxc.rs/docs/guide/usage/linter/plugins)
- [Oxlint type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
- [`tsgolint` official repository and rule list](https://github.com/oxc-project/tsgolint)
- [Oxlint JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins)
- [Oxlint ESLint migration](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)
- [Oxlint versioning policy](https://oxc.rs/docs/guide/usage/linter/versioning)
- [Oxc parser](https://oxc.rs/docs/guide/usage/parser)
- [Microsoft: Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
