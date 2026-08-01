# Asset Delivery Resilience

**Status:** In progress

**Last updated:** 2026-08-01

## Progress Snapshot

- Done: asset-safe Pages middleware, build-reference verification, bounded cache metadata, and
  one-shot newer-build recovery.
- In progress: local review and commit preparation.
- Next: production deployment and live custom-domain verification remain separately authorized
  steps.
- Blockers: none.

## Problem Statement

SKeyDB's production site can serve the SPA document (`index.html`) for a request that was
intended to load a hashed JavaScript asset. The browser receives a successful HTTP response,
but rejects the module because its MIME type is `text/html` rather than JavaScript. The
failure happens before the requested module can execute, so the React application cannot repair
the response after the fact.

The current Cloudflare Pages fallback is broad enough to rewrite an unknown path to the SPA
shell. That is useful for client-side routes such as `/database` and `/builder`, but unsafe for
the generated asset namespace. A stale edge object, an incomplete deployment, or an index/asset
version mismatch can therefore turn an asset miss into cacheable HTML. The existing loading
diagnostics feature can explain and report the symptom, but it does not prevent the bad response.

The incident that motivated this work requested the hashed modules for two battle-buff chunks and
received the full SKeyDB HTML document for both. The same user could use the GitHub Pages host,
and a previous desktop report recovered after a Cloudflare purge and hard refresh. Current live
checks show the custom domain serving those affected paths as JavaScript, while GitHub Pages
currently serves a different set of hashed chunk names. This makes a host-specific edge or
deployment mismatch more likely than a universal browser or release failure, but the application
does not currently enforce the delivery contract that would prevent it.

## Solution

Establish an asset-safe delivery contract for the production site and extend the existing local
diagnostics so maintainers can distinguish a routing miss, stale edge response, or deployment
mismatch without asking mobile users to open DevTools.

The delivery layer will keep SPA fallback behavior for navigational document requests while
excluding generated assets from that fallback. A missing or unavailable built asset must return a
non-success response and must never return the SPA HTML document. The build and deployment checks
will verify that the document references only assets present in the same build and that the
production-like route behavior preserves both deep links and asset failure semantics.

The diagnostics panel will remain the user-facing recovery surface. Its bounded same-origin
asset probe will capture a small allowlist of response metadata useful for cache and edge
investigation, including normalized content type, status, cache-control, cache status, age, and
entity tag when present. It will continue to omit response bodies, query strings, hashes, storage,
and automatic transmission. A failed asset load may perform one guarded version check and reload
when the no-cache version document proves that a newer build is available; it must not loop or
silently clear user state.

## User Stories

1. As a SKeyDB user, I want a missing JavaScript asset to fail as a missing asset, so that the browser does not mistake the SPA document for executable code.
2. As a SKeyDB user, I want `/database`, `/builder`, and other deep links to continue loading through the SPA shell, so that asset hardening does not remove normal navigation.
3. As a SKeyDB user, I want a transient asset failure to offer a safe reload, so that I can recover without clearing site data.
4. As a SKeyDB user, I want a detected newer build to trigger at most one controlled reload, so that an index/chunk mismatch can self-heal without an infinite refresh loop.
5. As a SKeyDB user, I want reload recovery to preserve Builder and Collection data, so that troubleshooting cannot destroy my saved work.
6. As a SKeyDB user on a phone, I want the existing incident panel to explain whether the failure looked like a missing asset, HTML fallback, network failure, or runtime failure, so that I can follow the right next step.
7. As a phone user without DevTools, I want to copy a short diagnostic report, so that I can provide useful evidence to the maintainer.
8. As a user affected by a CDN or edge mismatch, I want the report to include safe cache metadata, so that maintainers can distinguish a stale response from an origin miss.
9. As a privacy-conscious user, I want the report to exclude response bodies, query parameters, URL hashes, cookies, storage, and application data, so that troubleshooting does not expose my saved teams or imported codes.
10. As a privacy-conscious user, I want diagnostic collection to remain explicit and local-only, so that no report is sent to a third party without a separate consent flow.
11. As a user whose clipboard is unavailable, I want a selectable sanitized fallback, so that I can still share the report manually.
12. As a user, I want the incident reference to remain short and local, so that screenshots and copied reports can be correlated without creating server-side tracking.
13. As a maintainer, I want an asset miss to return a 404 rather than `index.html`, so that the response status communicates the actual failure.
14. As a maintainer, I want a regression check for HTML returned under an asset URL, so that a future Pages configuration change cannot silently reintroduce the incident class.
15. As a maintainer, I want a build check to validate all document-referenced module, preload, stylesheet, and asset URLs, so that an index from one build cannot be published alongside an incomplete asset set.
16. As a maintainer, I want the production-like smoke check to cover both a deep-link document and an existing asset, so that routing changes are tested at the seam where they can break users.
17. As a maintainer, I want the smoke check to cover an unknown asset path, so that the test proves it is not rewritten to the SPA shell.
18. As a maintainer, I want cache metadata normalized into a stable report format, so that reports from different browsers are comparable.
19. As a maintainer, I want diagnostic probes restricted to same-origin built assets, so that arbitrary URLs cannot be fetched on behalf of the user.
20. As a maintainer, I want redirects that leave the SKeyDB origin to be recorded as an unexpected result rather than followed, so that probes cannot become an open redirect or cross-origin fetch mechanism.
21. As a maintainer, I want existing healthy newer-version notices to remain separate from actual loading incidents, so that update availability is not reported as a crash.
22. As a maintainer, I want the feature to work without an issue tracker, support email, telemetry service, or backend endpoint, so that the copied report remains useful under the project's current contact model.
23. As a maintainer, I want the hardening change to preserve direct asset URLs used by legitimate consumers, so that a fix does not depend on renaming the asset namespace or breaking hotlinks.
24. As a maintainer, I want deployment verification to validate each host's own build and delivery contract, so that a healthy response on one host is not treated as proof for the other.
25. As a maintainer, I want uncertainty preserved in user-facing wording, so that an observed HTML response is not presented as proof of a specific CDN or browser cause.

## Implementation Decisions

- Define the generated asset namespace as a protected delivery surface. Requests under that
  namespace must bypass the document fallback and must not be rewritten to the SPA shell.
- Preserve the document fallback for extensionless application routes and other explicitly
  supported navigational requests. The exact Cloudflare Pages mechanism may be a supported
  exclusion rule, a Pages Function, or an equivalent front-controller rule; the implementation
  must be verified against the deployed platform rather than relying on redirect ordering alone.
- Keep the current asset URL namespace and Vite content-hash naming. This work must not rename
  `/assets/` or otherwise invalidate legitimate direct asset links as a cache-busting shortcut.
- Treat an unavailable generated asset as a real not-found or unavailable response. It must not be
  a `200` response containing `index.html`, regardless of whether the request originated from a
  module preload, dynamic import, stylesheet, or direct navigation.
- Add a build-manifest integrity check that derives the referenced generated URLs from the built
  document and confirms that each corresponding file exists in the same build output. The check
  must cover module scripts, modulepreload links, stylesheets, and other generated references
  emitted into the document.
- Add a production-like routing smoke check around the hosting contract. It must prove that a
  valid deep link returns the SPA document, a known generated asset returns its expected static
  content type, and an unknown generated asset does not return the SPA document.
- Extend the existing bounded asset probe with an allowlist of response headers: normalized
  `content-type`, HTTP status, `cache-control`, CDN cache status when present, `age` when present,
  and `etag` when present. Header values must be length-limited and control-character-free.
- Keep probe requests same-origin and limited to the built-asset namespace. Use a short timeout
  and cache-bypass request semantics for diagnosis, but strip any probe query string before it can
  enter the incident model or copied report.
- Do not read or copy the probe response body. A status and normalized MIME type are sufficient to
  identify the HTML-as-JavaScript failure class.
- When an asset-load incident is classified, perform at most one no-cache version check per page
  session. If the version document proves that the build changed, reload once with an in-memory
  guard. If the version check is unavailable or unchanged, leave the ordinary reload action in
  place and do not loop.
- Keep the version check and recovery guard independent of Local Storage, Session Storage,
  IndexedDB, cookies, Builder state, Collection state, and migration payloads.
- Reuse the existing loading-incident model, classifier, sanitization, clipboard fallback, and
  accessibility behavior. This companion work adds delivery evidence and recovery behavior; it
  does not create a second error panel or a second diagnostics schema.
- Verify custom-domain and GitHub Pages builds independently. Their base paths, build environment,
  or deployment timing may legitimately produce different hashed manifests; compare source
  revisions or build identifiers only when investigating an unexpected release drift, not as a
  prerequisite for edge-health verification.
- Preserve uncertainty in the UI: an HTML response is an observed response-type mismatch, while
  stale cache, routing fallback, deployment skew, filtering, and network interruption remain
  possible explanations unless the evidence distinguishes them.
- Do not add automatic cache purges, telemetry, support email integration, remote report upload,
  service-worker cache clearing, or user-data deletion as part of this change.

## Testing Decisions

- Tests will assert externally visible delivery and recovery behavior, not the implementation
  details of a particular redirect parser or Cloudflare API call.
- The highest-value seam is a production-like route harness that exercises document fallback and
  generated-asset lookup together. It should make the exact regression red when an unknown asset
  returns `index.html` with a success status.
- The build integrity seam will build or inspect a representative production output and verify
  that every generated URL referenced by the document resolves to a file in that same output.
- Routing coverage will include a valid client-side route, a known JavaScript asset, a known
  stylesheet, and an unknown JavaScript asset. Assertions will include status and normalized
  content type, not just response bodies.
- A regression fixture will model the historical failure: an asset request receiving the full SPA
  document. The expected result is a rejected asset delivery contract and a diagnostic category
  that identifies the HTML response without claiming why it occurred.
- Diagnostic coverage will verify that allowlisted cache metadata is included when present,
  omitted when absent, normalized deterministically, and bounded in length.
- Diagnostic privacy coverage will verify that response bodies, query strings, hashes, storage,
  application data, cross-origin URLs, and arbitrary headers never appear in copied output.
- Probe security coverage will verify same-origin asset restrictions, blocked cross-origin
  redirects, timeout handling, and network rejection handling.
- Recovery coverage will verify one reload when a no-cache version check proves a newer build, no
  reload when the version is unchanged or unavailable, and no repeat loop when the same incident
  remains after the guarded attempt.
- Existing app-shell loading-incident tests remain the prior art for deduplication, user-visible
  wording, clipboard behavior, and the absence of duplicate recovery panels.
- Existing Cloudflare Pages header tests remain prior art for protecting SPA fallback responses
  from unsafe immutable caching; they should be extended or paired with the routing contract test
  rather than replaced by a brittle string-only assertion.
- Verification will include focused unit and integration tests, script tests, formatting, lint,
  type checking, the bounded suite, and a production build.
- A manual mobile-width pass will confirm that the recovery panel remains usable and that copied
  diagnostics can be selected on a touch device.

## Out of Scope

- Renaming the `/assets/` namespace or changing Vite chunk naming solely to invalidate old URLs.
- Automatically purging Cloudflare, Cache Reserve, browser HTTP caches, or intermediary caches.
- Proving that every Cloudflare point of presence has the same state from a single local browser.
- A complete replacement for Cloudflare Pages with another hosting provider.
- Automatic telemetry, Sentry, analytics events, issue-tracker submission, mailto support, or a
  backend diagnostics endpoint.
- Reading, exporting, repairing, clearing, or migrating Local Storage, IndexedDB, cookies, Builder
  data, Collection ownership, imported codes, or saved planner state.
- A service worker or offline application-shell cache.
- Guaranteeing recovery when the application shell itself cannot load or when the edge continues
  returning invalid content after the guarded reload.
- Reworking unrelated navigation, update notices, or page-level error surfaces.

## Further Notes

- The historical symptom was two `200 text/html` responses for hashed module URLs, followed by the
  browser's strict module MIME error. This is a delivery-contract failure, not an exception that
  React can catch before module evaluation.
- The current custom-domain browser check observed the affected module paths returning successful
  JavaScript responses with revalidation metadata, and the Database route loaded normally. That
  demonstrates the contract can be healthy from one path today; it does not establish that every
  edge or user sees the same response.
- GitHub Pages currently uses different hashed chunk filenames from the custom domain, which is
  expected for independently configured deployments. Each host's own document references and
  response contract should be verified; cross-host identity comparison is optional diagnostic
  context rather than a correctness gate.
- The existing diagnostics plan remains the companion user-facing work. This plan is the
  preventive and deployment-integrity layer that makes its asset evidence more actionable.
- No issue-tracker integration or triage vocabulary is configured in this repository's local
  planning docs. This specification is recorded as a repo-native plan; publishing it externally is
  a separate, explicitly authorized step.
