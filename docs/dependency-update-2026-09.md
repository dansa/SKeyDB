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

## Optional follow-up review

Reviewed the eight diagnostics against the current code, then reused the fixed en-GB/UTC release-date formatter at module scope. This preserves output on desktop and mobile and removes the formatter warning. The changed-file Doctor scan now reports seven warnings and no errors; no suppressions were added.

| Finding | Assessment and decision |
| --- | --- |
| Formatter construction | Confirmed, low-impact inefficiency; fixed without adding state or changing formatting. |
| Index membership lookup | Correct observation, low impact: the desktop loop checks a handful of top-level groups (three quote categories, two upgrade/skill groups, or four stories). Building another Set every render is unnecessary at this size. |
| Story filter followed by map | Correct observation, low impact: a small profile story collection, outside the scroll handler. Keep the readable pipeline. |
| Exchange key ordinal | No demonstrated identity bug. The key includes Awakener ID, quote ID and position. The loaded exchange is an immutable, ordered snapshot; repeated references must remain distinct. Removing the ordinal could introduce duplicate keys. Revisit if exchanges become editable or reorderable. |
| Lore reader complexity | Branch-heavy but cohesive section rendering, with no demonstrated correctness defect. The user confirmed this covers essentially all in-game lore. Keep it together; do not schedule a speculative split when further growth is unlikely. |
| Modal body complexity | Mostly desktop/mobile layout and tab predicates. It already delegates header, sidebar and tab contents. Further extraction currently requires forwarding a large group of props without removing decisions. |
| Profile facts complexity | Mostly optional fields, separator placement and compact/content-scale presentation. Keep these related display rules together. |
| Quote component complexity | Four loading states plus expansion and retry behavior. The discriminated union keeps transitions explicit. No race was demonstrated by this warning; avoid introducing a generic async abstraction just to lower branch count. |

### Zod measurements and API fit

A temporary Vitest probe used the real 60-record lite catalog and exported `awakenerLiteDatasetSchema`. In one local Node 24/jsdom run, the first `getAwakenersLite()` call took 3.87 ms, excluding module import time. The getter then returns a cached result. Nine batches of 100 repeated parses had median per-call times of 0.075 ms for plain parsing and 0.0086 ms for compiled parsing. Creating the compiled schema took 1.47 ms, and its first parse took 0.27 ms. Compiled output matched the existing output. These are local diagnostic timings, not browser or whole-application benchmarks; the temporary probe was removed.

Compilation helps synthetic repeated parsing, but the actual getter caches its work. Do not enable global auto-compilation for this PR. If profiling identifies a frequently repeated resolver parse as a bottleneck, measure and compile that specific schema, including compilation cost and emitted bundle impact.

Do not replace parsing with `z.validate()` at current boundaries. Catalog adapters consume parsed output and use normalizing schemas; the exchange participant path also consumes `parsed.data`. Boolean validation cannot supply those transformed/defaulted values or validation issue details. The lower schema-memory footprint and faster failed parsing from Zod 4.5 are already available from the dependency upgrade without further changes. See the [Zod announcement](https://zod.dev/blog/zod-4-5).

### Other items surfaced during maintenance

- **Native React compiler:** keep disabled. The [plugin changelog](https://github.com/vitejs/vite-plugin-react/blob/plugin-react%406.1.1/packages/plugin-react/CHANGELOG.md) marks it experimental and requires an additional package. A separate experiment should compare rendering performance, bundle/build cost and interaction behavior before adoption.
- **Vitest isolation:** retain it. Route and exchange tests use module mocks, and routes also mutate localStorage. A faster run with reused workers is not enough evidence that state cannot leak across files. Use targeted shuffled/repeated runs for flake investigations, rather than adding repeat cost to every CI test. See [Vitest performance guidance](https://vitest.dev/guide/improving-performance.html).
- **Browser smoke readiness:** addressed. Each run owns a Vite child process with a fresh disposable cache, which leaves existing dev servers and their caches untouched. Navigation waits for the document response and then the actual Builder surface, with a dedicated 60-second cold-compilation budget; interaction waits remain unchanged. Failures include pending request URLs and browser errors. Nested cleanup closes the browser, waits for the owned Vite process to exit, and removes the temporary cache even when startup or assertions fail. The cold-cache run passed all three viewports, including desktop/adaptive drag and drop. This follows [Playwright guidance](https://playwright.dev/docs/api/class-page#page-goto) to use application assertions instead of network-idle readiness.
- **Node types:** the existing Node 26 types versus Node 24 runtime mismatch remains. Aligning the type major to the deployed runtime is reasonable separate dependency hygiene, but the patch updates did not introduce it or adopt new Node 26 APIs.
- **npm allow-scripts notice:** this comes from machine-level configuration, not a repository `.npmrc`. Do not change the user's package-script security policy as part of repository cleanup.

Validation for this follow-up: profile component tests, type-aware lint, formatting and the changed-file React Doctor scan. No visual output changes are intended.

The browser-smoke follow-up also passed the production build and all 20 script tests. An intentional blocked-script failure was used to verify nonzero exit, browser-error diagnostics and temporary-cache/server cleanup.

The forced-failure check exposed lingering Vite optimizer work with an in-process server. Keeping Vite in an owned child process resolves this: the final deliberate failure exited nonzero in 2.5 seconds with diagnostics and released its cache and port.
