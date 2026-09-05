# Awakener detail readers

## Approved scope

The Awakener modal retains its desktop portrait, profile, and progression sidebar. Its header and primary tabs remain visible above the reading scroll area. Lore, Skills, and Upgrades share a contextual index in the previously unused right-hand space.

- Lore has quieter Intro, Stories, Quotes, and Skills navigation below the primary tabs.
- Intro shows the introduction without an unnecessary index. On mobile it also contains the profile facts otherwise shown in the desktop sidebar.
- Stories shows one complete chapter at a time. Its index selects chapters; quiet previous/next footer controls open adjacent chapters at the beginning. Unlock conditions are source metadata, never website access gates.
- Quotes is a continuous list grouped into Daily, Battle, and Traphase. Its index jumps to groups or individual entries and tracks the visible entry.
- Skill Lore is a continuous list of the current character's available skill lore. Combat descriptions and progression controls stay in the other tabs.
- Skills and Upgrades retain continuous scrolling. Their indexes derive from the same displayed collections, including optional entries only when present. All groups start expanded and retain manual collapse choices while scrolling.
- The right index is slim and becomes a grouped native Index selector when the reading shell is narrower than 700px. The existing compact mobile character header and scrolling progression controls remain available.
- Read full exchange is a quiet text button. Activation fetches only missing participant records, preserves the supplied speaker order, and expands inline. Loading and retry stay beside the original quote; collapse restores the standalone quote. No audio or player-unlock controls are introduced.
- Lore section headings use the existing serif treatment; individual quote and skill names use the smaller gold sans-serif treatment. Lore content and the profile facts embedded in mobile Intro follow the database text-size setting. Desktop sidebar facts retain their fixed size. Subtabs and index controls keep a fixed small size and the primary tabs' sans-serif semibold treatment.
- Release dates appear beneath profile facts, separated from in-world information, in day-month-year order.
- A requested anchor stays selected when the end of the scroll area prevents top alignment. Active tracking resumes on subsequent scrolling without adding an empty spacer.

## Implementation boundaries

`DetailIndexedReader` owns local scrolling, anchor focus, active-entry tracking, responsive navigation, and scroll positions keyed to Lore section/chapter while that reader is mounted. Its controlled selection mode supports chapters without teaching the common component about story data. Character changes reset reader state. Switching away from a main modal tab remounts that tab on return.

`AwakenerDetailLore` owns content selection and source-backed index entries. `AwakenerQuoteText` owns request/expansion state. The domain exchange resolver validates quote references and reads counterpart records through the existing retryable record cache; it does not load counterpart skill, talent, or upgrade dependencies.

The optional voice and skill-lore contracts preserve older records that have no such fields. Generated game data and assets remain unchanged.

## Verification

Behavioral tests cover local anchor focus/scrolling, grouped and chapter navigation, active-group tracking, section scroll restoration, optional index entries, story markup, exchange ordering, deferred requests, and failure/retry. Browser checks cover the desktop rail, narrow-screen selector, persistent navigation, inline exchange loading, and counterpart-only requests. Repository formatting, lint, React Doctor, tests, and build are checked before handoff.

## Shipped lore token audit

The final scan covered lore fields and profile story/quote strings across Public V3 records. All brace variants were Male/Female alternatives and now render in source order with a slash. Wrapped tags present were Italic, Bold, Del, and Red; deletion and red emphasis are now supported alongside the existing formatting and @1-@4 redaction glyphs. No HTML entities or additional bracket/dollar placeholders were found in these strings.

One unresolved source anomaly is preserved literally: Arachne Story I contains `A.F. 3@7`. The known redaction tokens only define @1-@4, so the renderer does not invent an interpretation for @7. Apparent tokens such as @16 in other dates are @1 followed by ordinary date digits.
