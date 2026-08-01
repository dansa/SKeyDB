# Actionable Loading Error Diagnostics

**Status:** In progress

**Last updated:** 2026-08-01

## Progress Snapshot

- Done: approved specification, implementation, review remediations, and the final full verification pass.
- In progress: local commit preparation.
- Next: publishing, deployment, and remote tracker changes remain separate user-authorized steps.
- Blockers: none.

## Problem Statement

When SKeyDB fails while loading a lazy page on a phone, the user currently sees generic and
sometimes duplicated recovery messages. One message assumes that the site was updated while
the tab was open, while another only says that an unexpected loading problem occurred. Those
messages do not distinguish a stale deployment asset from a bad MIME response, an interrupted
network request, a network filter, an unsupported browser, or a genuine application exception.

Mobile users normally cannot inspect the browser console without connecting their phone to a
computer and enabling remote debugging. As a result, they cannot provide the evidence needed
to diagnose the failure, and maintainers are left asking them to clear data or try broad fixes
that may be unrelated and may put locally saved Builder or Collection data at risk.

## Solution

Replace the generic and duplicated loading-failure surfaces with one actionable incident panel.
The panel will explain the most specific cause SKeyDB can establish without overstating
certainty, offer a safe reload action, and let the user explicitly copy a small sanitized
diagnostic report to their clipboard.

SKeyDB will retain the original dynamic-import or React error long enough to classify it. When
the failure identifies a same-origin built asset, SKeyDB will perform a bounded read-only probe
of that asset and report only its status, MIME type, and query-free asset path. The copied report
will include the current build, page pathname, time, broad browser/platform information,
connectivity state, normalized failure category, and sanitized technical evidence. It will not
read saved application data, include URL query strings or hashes, persist the incident, or send
anything automatically.

## User Stories

1. As a mobile SKeyDB user, I want a loading error to explain what kind of failure occurred, so that I know whether retrying is likely to help.
2. As a mobile SKeyDB user, I want one recovery panel for one incident, so that duplicate warnings do not make the problem appear worse or more confusing.
3. As a user with a failed page module, I want the message to avoid claiming that a deployment occurred unless SKeyDB has evidence for that conclusion.
4. As an offline user, I want the recovery panel to recognize that I appear to be offline, so that I can restore connectivity before retrying.
5. As a user whose network blocks an asset, I want the error to describe a network or filtering problem as a possibility, so that I can test another connection or disable a filter.
6. As a user with an outdated browser, I want to see an advisory compatibility hint, so that I can update the browser instead of repeatedly clearing data.
7. As a user affected by a stale deployment asset, I want the error to explain that the page and deployed files do not match, so that refreshing has a clear purpose.
8. As a user affected by an HTML response for a JavaScript asset, I want the report to identify the response-type mismatch, so that the maintainer can recognize an asset-routing or cache failure.
9. As a user affected by a genuine application exception, I want the panel to distinguish it from a failed page download, so that irrelevant cache troubleshooting is avoided.
10. As a user, I want a reload action to remain available, so that transient failures still have a simple recovery path.
11. As a phone user without DevTools, I want to copy diagnostic details, so that I can paste useful evidence into the place where I contacted the project maintainer.
12. As a phone user, I want confirmation when diagnostics were copied, so that I know the action succeeded.
13. As a user whose browser denies clipboard access, I want a selectable-text fallback, so that I can still share the report manually.
14. As a user, I want a short incident reference visible in the panel, so that screenshots and copied reports can be matched to the same failure.
15. As a privacy-conscious user, I want diagnostic copying to happen only after an explicit action, so that no report leaves the page without my knowledge.
16. As a privacy-conscious user, I want diagnostics to exclude Builder teams, Collection ownership, imported codes, and all other locally saved SKeyDB content, so that support information cannot expose my data.
17. As a user opening a URL containing migration or other parameters, I want query strings and hashes excluded from diagnostics, so that transferable or sensitive URL data is not copied.
18. As a user, I want diagnostics to remain in memory only for the current failure, so that error reports do not become another persistent data store.
19. As a user, I want technical details hidden behind a deliberate disclosure or copy action, so that the main recovery message remains understandable.
20. As a keyboard or assistive-technology user, I want the incident panel and its status changes to be announced and operable, so that recovery does not depend on pointer input.
21. As a maintainer, I want the current build identifier and UTC timestamp, so that I can correlate the report with a deployment.
22. As a maintainer, I want the route pathname and normalized browser/platform version, so that I can identify route-specific and compatibility-specific patterns.
23. As a maintainer, I want the original Vite preload failure to be retained and normalized, so that dynamic-import failures do not lose their most useful evidence.
24. As a maintainer, I want React error-boundary information reduced to safe component and asset-frame evidence, so that genuine crashes can be localized without copying arbitrary runtime state.
25. As a maintainer, I want a bounded asset probe result, so that I can distinguish missing assets, HTML fallbacks, healthy JavaScript responses, and failed network requests.
26. As a maintainer, I want equivalent Vite, promise-rejection, window-error, and React-boundary signals deduplicated, so that one root cause produces one incident.
27. As a maintainer, I want diagnostic formatting and sanitization to be deterministic, so that pasted reports are comparable and regression-testable.
28. As a maintainer, I want ordinary new-version notifications to remain separate from load-failure incidents, so that a healthy update prompt does not look like a crash.
29. As a maintainer, I want the diagnostic feature to work without an email address or support backend, so that it provides value with the project’s current contact model.
30. As a maintainer, I want unknown cases to preserve uncertainty in their wording, so that the UI never presents a hypothesis as a verified cause.

## Implementation Decisions

- Introduce one shared in-memory loading-incident model consumed by the app-level notice and the React recovery boundary. It will represent the failure source, normalized category, timestamp, build identifier, pathname, safe environment metadata, optional asset evidence, and a short local incident reference.
- Preserve the original error carried by Vite’s preload-error payload. Promise-rejection and window-error handlers will feed the same incident classifier rather than reducing every matching event to a reason string.
- Feed errors and React component information captured by the recovery boundary into the same classifier. The boundary will render the shared incident experience rather than maintaining a second generic error presentation.
- Deduplicate equivalent signals occurring during the same navigation by normalized category, query-free asset path, error fingerprint, and a short time window. A later unrelated failure must still create a new incident.
- Keep the healthy newer-version notification independent from loading incidents. It may continue to be dismissible, while an active loading incident remains a recovery surface.
- Use conservative categories: offline, dynamic-import or asset-load failure, browser-compatibility concern, and application-runtime failure. Wording will clearly distinguish verified observations from possible explanations.
- Treat browser compatibility as an advisory unless the browser family and major version can be parsed confidently and compared with the declared production build targets. Unknown or embedded browsers will not be labeled unsupported solely from user-agent text.
- When a failure yields a same-origin path under the built-asset namespace, perform one bounded probe with cache bypass and a short timeout. Record only whether the request completed, HTTP status, normalized MIME type, and the final same-origin query-free asset path.
- Never probe arbitrary origins or paths. Redirects leaving the SKeyDB origin will be recorded as a blocked or unexpected probe result without following them for diagnostic purposes.
- Do not retain or copy response bodies. An HTML MIME result is sufficient to identify the class of failure without copying the fallback document.
- Generate the incident reference locally. It is a correlation aid for a screenshot and copied report, not a server-side tracking identifier.
- Collect only the current build identifier, UTC timestamp, pathname, browser family and major version when available, broad platform, online state, optional effective connection type, normalized error category, safe error fingerprint, and bounded asset-probe evidence.
- Exclude the page query string, URL hash, referrer, IP address, device identifiers, full high-entropy user-agent details, localStorage, sessionStorage, IndexedDB, cookies, Builder data, Collection data, migration payloads, and imported or exported codes.
- Normalize known browser-generated module and network errors into stable descriptions. For unknown runtime errors, prefer error type, a stable fingerprint, safe same-origin asset frames, and React component names over unrestricted raw messages or stacks.
- Apply length limits and control-character removal to every copied field. Strip query strings and hashes from any URL-like value before it can enter the incident model.
- Build the clipboard report only when the user requests it. Do not persist incidents and do not transmit them to Cloudflare, GitHub, analytics, or any third party.
- Use the asynchronous Clipboard API when available in the secure context. If copying fails or is unavailable, reveal the already-sanitized report in a selectable text control and explain that it can be copied manually.
- Provide brief success feedback after copying without dismissing the incident or navigating away.
- Keep the primary panel concise: specific title, uncertainty-aware explanation, incident reference, reload action, and copy-diagnostics action. Technical evidence may be progressively disclosed rather than shown by default.
- Preserve accessible alert semantics for the failure and announce clipboard success without repeatedly re-announcing the entire incident.
- Reload remains the recovery action. This work will not automatically clear HTTP cache, unregister browser state, or remove SKeyDB’s persisted user data.

## Testing Decisions

- Tests will assert user-visible behavior and copied output rather than internal state shape or classifier implementation details.
- The primary test seam will exercise the recovery flow at the app-shell level. A synthetic preload failure with original error evidence will produce exactly one incident panel even when the corresponding rejected lazy import reaches the React boundary.
- The primary seam will cover the incident title, uncertainty-aware explanation, reload action, copy action, clipboard confirmation, and the absence of the old duplicated panel.
- Asset-probe behavior will be exercised through controlled same-origin responses representing missing assets, HTML returned for JavaScript, healthy JavaScript, redirects outside the allowed origin, timeouts, and network rejection.
- A dedicated privacy seam will feed diagnostics hostile and sensitive-looking values, including query parameters, hashes, long strings, control characters, cross-origin URLs, migration-like payloads, and stack content. Assertions will verify that none of those values survive in copied output.
- The privacy seam will verify that diagnostic creation does not read browser storage APIs or application repositories.
- Runtime-failure coverage will verify that React boundary evidence produces one application-failure panel and only sanitized component or asset-frame information.
- Compatibility coverage will verify that a confidently parsed browser below the configured target produces an advisory, while unknown and current browsers do not receive a false unsupported-browser claim.
- Clipboard coverage will include successful asynchronous copy, rejected clipboard permission, unavailable Clipboard API, selectable fallback text, and success-status accessibility.
- Existing notice tests are prior art for visible copy and actions. Existing recovery-boundary tests are prior art for thrown lazy-page failures; they should be raised to the combined app-shell seam where duplication can be observed.
- Existing newer-version tests will remain and verify that healthy update availability is not converted into a loading incident.
- Verification will include focused unit and integration tests, formatting, linting, type checking, the bounded test suite, and a production build.
- A manual mobile-width check will confirm that the incident reference and actions fit without horizontal overflow and that the fallback diagnostic text can be selected on a touch device.

## Out of Scope

- Automatic error telemetry, Sentry, analytics events, a Cloudflare reporting endpoint, or any other server-side collection.
- A mailto support flow or establishing a SKeyDB support email address.
- Automatically submitting reports to GitHub, Discord, or another contact channel.
- Reading, exporting, repairing, clearing, or migrating localStorage, IndexedDB, Builder state, or Collection state.
- Automatically purging browser cache or Cloudflare cache.
- Replacing Android remote debugging for cases that still require full console and network traces.
- Guaranteeing support for browser versions below the configured production targets.
- Redesigning unrelated notices, navigation, or general feedback UI.
- Changing Cloudflare Pages routing or cache policy as part of this feature.
- Treating every runtime exception as safely recoverable without a reload.

## Further Notes

- The triggering report came from Android Chrome and showed both the global preload warning and the React recovery-boundary warning at the same time on the Database route. Database and Builder were reported unavailable.
- A fresh Android-sized production-browser check loaded both affected routes successfully and observed their JavaScript assets returning successful JavaScript responses. That makes device, browser, network path, persistent browser state, and edge-specific behavior important diagnostic dimensions rather than proving a universal release regression.
- Initial support questions should remain useful even after this feature ships: Incognito separates the normal browser profile from a fresh session, and switching Wi-Fi versus mobile data separates many device/profile failures from network-path failures.
- Android Chrome’s supported full-console workflow requires remote debugging from another computer. The clipboard report is intended to make the common first diagnostic pass possible without imposing that workflow on users.
- If remote opt-in reporting is added later, it requires a separate privacy and retention decision. This local-only report must not silently become a telemetry payload.
