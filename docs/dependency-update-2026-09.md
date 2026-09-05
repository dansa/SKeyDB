# September dependency maintenance

## Review and CI follow-up

PR [86](https://github.com/dansa/SKeyDB/pull/86#discussion_r3891080413) identified Common artwork persisting for Advanced Orison variants. The selected variant now determines artwork; regression coverage checks desktop, mobile and invalid-selection fallback.

The [merged CI run](https://github.com/dansa/SKeyDB/actions/runs/33346197504) and [PR CI run](https://github.com/dansa/SKeyDB/actions/runs/33346081459) timed out in the first database-grid test. [Deployment succeeded](https://github.com/dansa/SKeyDB/actions/runs/33346197505). Preloading real lazy browse modules during test setup reduced the first case from 2,486ms to 136ms locally. Shuffled order exposed a loading-shell readiness race, now fixed by waiting for loaded modal controls. No timeout increase or production loading change.

## Direct updates

| Package | Previous | Updated | Reviewed notes and impact |
| --- | --- | --- | --- |
| immer | 11.1.16 | 11.1.18 | [Releases](https://github.com/immerjs/immer/releases): structural sharing and Iterator type fixes. |
| react-router | 8.3.0 | 8.3.1 | [Changelog](https://reactrouter.com/changelog): aborted navigation, origin validation, matching and scroll fixes. No declarative-router migration. |
| zod | 4.4.3 | 4.5.4 | [Releases](https://github.com/colinhacks/zod/releases): lower schema memory use, parsing and default-factory fixes. |
| @playwright/test | 1.62.1 | 1.63.0 | [Release](https://github.com/microsoft/playwright/releases/tag/v1.63.0): removes Ubuntu 20.04 and experimental component testing; neither used. Chromium refreshed. |
| @testing-library/react | 16.3.2 | 16.3.3 | [Release](https://github.com/testing-library/react-testing-library/releases/tag/v16.3.3): fixes re-entrant act during event dispatch. |
| @testing-library/user-event | 14.6.4 | 14.6.7 | [Releases](https://github.com/testing-library/user-event/releases): focus retargeting, pointerType, DataTransfer aliases and iframe typing. |
| @types/node | 26.2.0 | 26.4.1 | [History](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/master/types/node): API additions and ffi pointer correction. Existing type major retained; runtime stays 24.16.0, no new Node 26 APIs adopted. |
| @types/react-dom | 19.2.4 | 19.2.7 | [History](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/master/types/react-dom): server options and browser bailout/reason types. |
| @vitejs/plugin-react | 6.0.5 | 6.1.1 | [Changelog](https://github.com/vitejs/vite-plugin-react/blob/plugin-react%406.1.1/packages/plugin-react/CHANGELOG.md): compiler/sourcemap work. Current react() config retained. |
| vite | 8.2.1 | 8.2.2 | [Changelog](https://github.com/vitejs/vite/blob/v8.2.2/packages/vite/CHANGELOG.md): module cycles, lazy requests, sourcemaps and Windows paths. |
| vitest | 4.1.10 | 5.0.0 | [Migration](https://vitest.dev/guide/migration/): prerequisites met; mocks, hoisting, async assertions, jsdom globals and Temporal timers reviewed. Entire suite passes without compatibility opt-outs. |
| oxfmt | 0.63.0 | 0.66.0 | [Releases](https://github.com/oxc-project/oxc/releases): comment/CSS/YAML preservation. Explicit file paths now bypass gitignore. Existing style retained. |
| oxlint | 1.78.0 | 1.81.0 | [Migration](https://github.com/oxc-project/oxc/pull/25500): combined React Compiler rule removed; see below. |
| react-doctor | 0.9.12 | 0.9.13 | [Changelog](https://github.com/millionco/react-doctor/blob/main/packages/react-doctor/CHANGELOG.md): cache/untracked-file fixes, analysis improvements and new advisory rules. |
| sharp | 0.35.3 | 0.35.4 | [Release](https://github.com/lovell/sharp/releases/tag/v0.35.4): coordinate bounds, palette bit depth, TIFF pages and streams. |
| simple-git-hooks | 2.13.1 | 2.14.0 | [Release](https://github.com/toplenboren/simple-git-hooks/releases/tag/2.14.0): worktree/root detection and quieter setup. Existing prepare script installs hooks explicitly. |

## Migration details

Oxlint now uses 17 enabled compiler-category rules. Config and gating have no published rules because options are fixed internally. Warning/bailout categories stay disabled. Memo-dependencies is enabled because [the new analyzer reclassifies prior memoization errors](https://github.com/oxc-project/oxc/pull/25830); turning it off would weaken coverage. It also adds some checks, so exact old behavior is unavailable. Type-aware lint passes with this configuration and no new suppressions.

Updated the existing fast-uri override from 3.1.5 to [3.1.7](https://github.com/fastify/fast-uri/releases/tag/v3.1.7) for security fixes, staying within Ajv's supported major. Refreshed browserslist 4.28.6 to [4.28.9](https://github.com/browserslist/browserslist/releases/tag/4.28.9), including the [4.28.7 security fixes](https://github.com/browserslist/browserslist/releases/tag/4.28.7). Audit reports zero vulnerabilities.

React Doctor adds eight nonblocking warnings. Reviewed: four complexity warnings identify conditional presentation components; two array warnings involve small navigation/story collections; the Intl formatter warning concerns infrequent profile rendering; the exchange key includes participant/line identity plus an ordinal to disambiguate immutable source exchanges. None demonstrates a correctness defect, and no suppression or unrelated refactor was added.

## Optional follow-ups

[Zod 4.5](https://zod.dev/blog/zod-4-5) adds schema compilation and validity-only validation. Profile actual catalog parsing before adopting either. The React plugin's experimental native compiler remains disabled; evaluate it separately. Vitest 5 repeat runs can help reproduce flakes. Keep isolation enabled despite the timing hint about reusing workers: changing isolation requires its own shared-state audit.

## Validation

Passed 2,038 Vitest tests across 275 files, 20 script tests, type-aware lint, formatting, production build and all 143 wheel-mini asset checks. React Doctor passed with the eight advisory warnings discussed above. The browser smoke passed desktop, adaptive and mobile layouts, including desktop/adaptive drag and drop. Its first run timed out during the cold Vite dependency optimization after the lockfile change; the subsequent run completed without timeout changes. No browser test changes were retained.
