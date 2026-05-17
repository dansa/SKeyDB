---
name: SKeyDB
description: A polished game-adjacent Morimens database and planning UI.
colors:
  app-night: "oklch(13.5% 0.025 257)"
  shell-night: "oklch(10.5% 0.024 254)"
  panel-night: "oklch(10.5% 0.025 252 / 0.76)"
  panel-night-strong: "oklch(8.5% 0.024 252 / 0.9)"
  art-well: "oklch(4.5% 0.018 252 / 0.86)"
  text-main: "oklch(91% 0.025 255)"
  text-muted: "oklch(77% 0.024 250 / 0.86)"
  text-faint: "oklch(61% 0.035 254 / 0.86)"
  amber-gold: "oklch(78% 0.1 84)"
  amber-gold-soft: "oklch(95% 0.035 84)"
  border-muted: "oklch(58% 0.04 232 / 0.34)"
  border-subtle: "oklch(58% 0.04 232 / 0.22)"
  focus-gold: "oklch(84% 0.1 84 / 0.38)"
  danger-red: "oklch(76% 0.078 28 / 0.88)"
  info-blue: "oklch(77% 0.07 236 / 0.88)"
  success-teal: "oklch(76% 0.066 188 / 0.88)"
  violet-meta: "oklch(76% 0.072 302 / 0.88)"
typography:
  display:
    fontFamily: "Droid Serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "0"
  headline:
    fontFamily: "Droid Serif, Georgia, serif"
    fontSize: "1.9rem"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "0"
  title:
    fontFamily: "Droid Serif, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "0.004em"
  body:
    fontFamily: "Noto Sans, Trebuchet MS, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0"
  label:
    fontFamily: "Noto Sans, Trebuchet MS, sans-serif"
    fontSize: "0.64rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  xs: "2px"
  sm: "3px"
  full: "9999px"
spacing:
  xs: "0.42rem"
  sm: "0.5rem"
  md: "0.85rem"
  lg: "1.4rem"
  page: "1.9rem"
components:
  button-quiet:
    backgroundColor: "{colors.panel-night}"
    textColor: "{colors.text-main}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0.46rem 0.8rem"
    height: "2.1rem"
  chip-filter:
    backgroundColor: "{colors.panel-night-strong}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0.32rem 0.44rem"
    height: "2rem"
  segmented-toggle:
    backgroundColor: "{colors.panel-night-strong}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    height: "2rem"
  masthead-summary:
    backgroundColor: "{colors.shell-night}"
    textColor: "{colors.amber-gold-soft}"
    typography: "{typography.title}"
    rounded: "{rounded.xs}"
    padding: "0.4rem"
  compact-card:
    backgroundColor: "{colors.panel-night}"
    textColor: "{colors.text-main}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.65rem"
---

# Design System: SKeyDB

## 1. Overview

**Creative North Star: "The Maintained Relic Ledger"**

SKeyDB should feel like a maintained game archive that has learned the habits of a serious tool. The page is dark, compact, and information-dense, but it keeps enough amber serif hierarchy, realm aura, and artwork to remind users that this is Morimens knowledge, not a generic admin dashboard.

The current visual canon is the Timeline and D-zone facelift. They use shallow mastheads, sharp panels, low-radius controls, restrained glow, compact labels, contextual art as supporting evidence, and careful text-on-art overlays where blur earns its keep. Builder and Collection redesigns should move toward this language while respecting their heavier interaction needs.

This system rejects generic SaaS cards, bare wiki pages, flashy game portals, purple-blue AI gradients, default glass panels, and mismatched component vocabularies. If a page starts to look like every control came from a different project, it has drifted.

**Key Characteristics:**
- Dark blue-slate surfaces with amber-gold state and identity.
- Serif names and season titles paired with dense sans controls and metadata.
- Sharp 2-3 px product geometry, with rounded pills reserved for legacy surfaces until redesigned.
- Art and realm color appear as contextual tints, not decoration.
- Translucent blur is allowed for text on artwork, with soft blur for title plaques and stronger blur for body-copy drawers.
- Motion is short, stateful, and disabled for reduced-motion users.

## 2. Colors

The palette is a restrained night archive: blue-slate structure, amber-gold attention, and local realm color used as an aura.

### Primary

- **Amber Gold** (`amber-gold`): The active-state and identity accent. Use for selected controls, current page emphasis, focus aura, section markers, and important serif headings.
- **Soft Amber Title** (`amber-gold-soft`): The readable title color for dark surfaces. Use for names, page titles, and highlighted labels that must stay legible.

### Secondary

- **Info Blue** (`info-blue`): Timeline and metadata tone for wheel or information categories.
- **Success Teal** (`success-teal`): Timeline and metadata tone for login, availability, or positive status categories.
- **Violet Meta** (`violet-meta`): Timeline and metadata tone for rerun, battlepass, skin, or similar classification.

### Tertiary

- **Danger Red** (`danger-red`): D-tide, raid, destructive, or danger-adjacent metadata. Use sparingly so it remains meaningful.

### Neutral

- **App Night** (`app-night`): Root app surface.
- **Shell Night** (`shell-night`): Deep page wash and masthead background.
- **Panel Night** (`panel-night`): Default panel and inspector surface.
- **Strong Panel Night** (`panel-night-strong`): Stronger nested control wells and compact tile backgrounds.
- **Art Well** (`art-well`): Icon, relic, monster, and fallback image wells.
- **Main Text** (`text-main`): Primary sans text on dark surfaces.
- **Muted Text** (`text-muted`): Descriptions, helper text, and secondary metadata.
- **Faint Text** (`text-faint`): Control labels and low-emphasis chrome.
- **Muted Border** (`border-muted`): Default panel and card stroke.
- **Subtle Border** (`border-subtle`): Internal dividers and low-emphasis separators.
- **Focus Gold** (`focus-gold`): Focus-visible outlines and rings.

### Named Rules

**The Amber Means State Rule.** Amber must mark active selection, current identity, focus, or important headings. It is not filler decoration.

**The Realm Aura Rule.** Realm colors tint headers, art, badges, and card borders locally. They do not replace the product palette globally.

## 3. Typography

**Display Font:** Droid Serif, with Georgia and serif fallbacks.
**Body Font:** Noto Sans, Trebuchet MS, and sans-serif fallbacks.
**Label/Mono Font:** Use the body stack for labels and tabular data unless a feature already has a local numeric convention.

**Character:** Droid Serif carries game texture and authority. The sans stack carries speed, density, and ordinary product legibility.

### Hierarchy

- **Display** (700, 3rem, 1.02): Page names and large season titles only.
- **Headline** (700, 1.9rem, 1.03): Inspector titles, history drawer titles, and feature section identities.
- **Title** (700, 0.96-1.12rem, 1.12): Card names, event titles, banner heroes, and compact named entities.
- **Body** (500, 0.86rem, 1.35): Descriptions, explanatory text, and dense readable copy. Keep prose around 65-75ch when it is not inside a card.
- **Label** (800, 0.58-0.72rem, 0.10-0.14em tracking): Control labels, metadata labels, chips, and taxonomy tags.

### Named Rules

**The Earned Serif Rule.** Use Droid Serif for names, seasons, event titles, and page identity only when the game texture helps. Do not use it for stats, controls, descriptions, taxonomy, prices, or dense data.

**The Sans Data Rule.** Stats, prices, counts, and compact metadata stay sans, medium-to-heavy, and tabular when alignment matters.

## 4. Elevation

SKeyDB is mostly flat at rest. Depth comes from tonal layering, hairline borders, inset highlights, art wells, text-on-art scrims, and small hover shadows. Shadows and blur should feel structural, like a dark interface making stacked information readable, not like floating marketing cards.

### Shadow Vocabulary

- **Panel Inset** (`inset 0 1px 0 oklch(88% 0.04 84 / 0.05)`): Subtle top hairline on inspectors and panels.
- **Card Lift** (`0 12px 26px rgba(2, 6, 23, 0.28)`): Banner and image-heavy card lift.
- **Hover Lift** (`0 18px 34px rgba(2, 6, 23, 0.34)`): Hover state for large artwork cards only.
- **Icon Drop** (`drop-shadow(0 0.35rem 0.8rem oklch(4% 0.02 250 / 0.7))`): Emblems, badges, and meaningful art icons.
- **Focus Glow** (`0 0 0 0.22rem oklch(82% 0.12 86 / 0.16)`): Visible focus support around amber states.
- **Soft Artwork Plaque** (`backdrop-blur-[2px]` with `bg-slate-950/28`): Static title labels over banner art.
- **Artwork Details Drawer** (`backdrop-blur-[10px]` with a dark vertical gradient): Body copy over banner art, where readability needs more separation.

### Named Rules

**The Flat Until Asked Rule.** Surfaces are flat unless hover, focus, expansion, or stacked artwork needs depth.

**The Text-on-Art Blur Rule.** Blur is allowed when text sits on artwork and needs legibility. Use the least blur that solves the reading problem: soft plaque for titles, stronger drawer for body copy.

**The No Decorative Glass Rule.** Blur may support text-on-art overlays and masthead/header readability. It is not a default panel material.

## 5. Components

### Buttons

- **Shape:** Sharp product control corners (2-3 px). Rounded pills belong only to legacy surfaces until redesigned.
- **Primary:** Amber border or amber active fill on dark blue-slate background. Text is amber-soft or main text.
- **Hover / Focus:** Border brightens, text warms, and focus gets a visible amber outline or ring.
- **Secondary / Ghost / Tertiary:** Quiet dark backgrounds, muted slate borders, and clear hover border shifts. Never rely on color alone for pressed state.

### Chips

- **Style:** Dark slate gradient or panel fill, 2 px radius, 11 px text, compact vertical padding.
- **State:** Active chips use amber border/text/fill. Inactive chips stay slate and brighten on hover.
- **Use:** Filters, alert selectors, stage labels, and taxonomy tags. Do not use chips as decoration.

### Cards / Containers

- **Corner Style:** 2-3 px for product panels. Database grid cards can use their shared frame conventions.
- **Background:** Deep slate panels with subtle radial context or art wells where useful.
- **Shadow Strategy:** Flat by default, small lift on hover for artwork or selectable cards.
- **Border:** Muted blue-slate or realm-tinted border, never a thick colored side stripe.
- **Internal Padding:** Dense: 0.5-0.9rem inside cards and inspectors, more only for mastheads or section openings.

### Inputs / Fields

- **Style:** Dark field, muted border, compact height, sans text, and no bright native select popup. Native selects must include `[color-scheme:dark]`.
- **Focus:** Amber border or outline, visible against dark panels.
- **Error / Disabled:** Error uses red/rose border and copy. Disabled uses opacity reduction plus cursor state.

### Navigation

- **Site Navigation:** Top navigation uses text links with amber underline activation and visible focus.
- **Section Navigation:** Database uses underline tabs on a rail, not pills.
- **Mobile Treatment:** Navigation can collapse, but key browse controls should wrap naturally where possible.

### Season Masthead

The shared `SeasonMasthead` is the current page-introduction primitive. It is full-bleed, shallow, context-heavy, and supports current season art, realm emblems, countdowns, and page controls. Use it for season, event, timeline, or D-zone contexts. Do not turn it into a marketing hero.

### Timeline Cards

Timeline event cards are compact rows with optional art slices, amber serif titles, taxonomy metadata, countdowns, and expandable descriptions. Banner cards are larger artwork cards with a quiet drawer and summary overlay. They are references for dense game data with art, not generic card grids.

### Artwork Text Overlays

Text over artwork must carry its own legibility system. Static banner title plaques use a translucent dark surface, amber hairline, small shadow, and soft `backdrop-blur-[2px]`. Details drawers use a stronger dark gradient, border divider, side shadow, and `backdrop-blur-[10px]` because they carry body copy. Do not use these treatments away from artwork.

### D-zone Inspector

The D-zone inspector is the current reference for complex product panels: one bordered tool surface, alert switcher, wave rows, relic buttons, monster tiles, realm-tinted header, and compact disclosure. It is dense but navigable.

## 6. Do's and Don'ts

### Do:

- **Do** use Timeline and D-zone as the current visual canon for new product-surface redesigns.
- **Do** keep page sections flowing on the app background unless the section is a real interactive tool.
- **Do** use amber for active state, focus, current identity, and key headings.
- **Do** keep product corners sharp at 2-3 px.
- **Do** use Droid Serif only where it visually earns the game-texture role, then switch to sans for controls, metadata, descriptions, and data.
- **Do** use soft or strong blur overlays when text sits on artwork and would otherwise lose contrast.
- **Do** respect reduced motion and keep transitions in the 150-230 ms range.
- **Do** preserve `/database` chip and card conventions until that surface is intentionally redesigned.

### Don't:

- **Don't** use generic SaaS dashboards with rounded cards, oversized hero stats, and abstract gradients.
- **Don't** use bare wiki pages where everything has the same text weight and no interaction hierarchy.
- **Don't** use flashy game portal layouts that make data harder to compare.
- **Don't** use nested card stacks or wrap every page section in a decorative card.
- **Don't** use purple-blue AI gradients, default glass panels, or decorative glow without state or content meaning.
- **Don't** mix database chips, builder ownership pills, and Timeline selectors as if they were one interchangeable component.
- **Don't** use Timeline banner blur treatments as ordinary panel styling away from artwork.
- **Don't** spam Droid Serif across every label, control, or description.
- **Don't** use a colored `border-left` or `border-right` thicker than 1 px as a card accent.
- **Don't** use gradient text.
