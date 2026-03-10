# Timeline Data

This folder contains the JSON data files that power the Timeline page. Edit these files to add, remove, or update events and banners.

## Date Format

All dates use the game's announcement format: **`YYYY/MM/DD HH:MM`** in **UTC+8** (Hong Kong / server time).

The loader converts these to UTC automatically, so visitors see correct countdowns in their local timezone.

```
"startDate": "2026/03/05 18:00"   ← 6 PM server time
"endDate":   "2026/03/19 11:59"   ← 11:59 AM server time
```

---

## events.json

Array of event objects. Each event appears as a card in the Events section.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **yes** | Unique identifier. Convention: `event-{category}-{short-name}` |
| `title` | string | **yes** | Display title |
| `category` | string | no | Determines the colored badge. See [Event Categories](#event-categories) below |
| `description` | string | no | Short description text |
| `startDate` | string | **yes** | Start time in `YYYY/MM/DD HH:MM` UTC+8 |
| `endDate` | string | **yes** | End time in `YYYY/MM/DD HH:MM` UTC+8 |
| `pinned` | boolean | no | Pinned events sort to the top |
| `featured` | string | no | Awakener or wheel name — shows their art as decoration on the right edge of the card. Auto-detected: if the name matches a wheel it renders as a wheel, otherwise as an awakener |
| `customArt` | string | no | Custom art URL or path. Overrides `featured` art if both are set. Use for skins, special promo art, raid art, etc. Non-URL values like `"TBD"` are ignored. Paths starting with `/events/` are resolved against `src/assets/events/*` (bundled), e.g. `/events/arachne.png` |
| `pricing` | string | no | Displays a silver pricing badge, e.g. `"960 Silver Prime"`, `"$24.99"` |
| `artAlign` | string | no | Overrides the default art positioning. Accepts any CSS `object-position` value. See [Art Alignment](#art-alignment) below |

### Event Categories

| Category | Badge Color | Use For |
|----------|-------------|---------|
| `gameplay-event` | Amber | New character story events, story reruns |
| `d-tide` | Red | Rotating raid / competitive PvE |
| `curriculum` | Violet | Seasonal task-track passes |
| `login` | Teal | Daily login bonus events |
| `skin` | Pink | Outfit / skin releases |
| `wheel-event` | Cyan | Wheel acquisition events (gacha for wheels) |
| `preorder` | Orange | Upcoming character preorder bundles |
| `maintenance` | Slate | Server maintenance windows |
| `campaign` | Emerald | Double drops, resource campaigns |
| `collab` | Fuchsia | Collaboration events |
| `other` | Slate | Anything that doesn't fit above |

### Art Alignment

By default, character art uses `top` positioning (shows head/upper body) and wheel art uses `center`. You can override this per-event with `artAlign`:

```json
"artAlign": "center"          // center the image
"artAlign": "top"             // show top (default for characters)
"artAlign": "bottom"          // show bottom
"artAlign": "50% 20%"         // precise CSS object-position (x y)
```

### Descriptions

Descriptions support `\n` for line breaks:
```json
"description": "Line one.\nLine two.\nLine three."
```

Note: double quotes inside strings must be escaped with `\"` — this is a JSON limitation.

### Example

```json
{
  "id": "event-story-vortice",
  "title": "Call of the Moskstraumen",
  "category": "gameplay-event",
  "description": "Gameplay and story event featuring Vortice.\nObtain SR-Wheel and more.",
  "startDate": "2026/03/09 09:00",
  "endDate": "2026/03/23 09:00",
  "pinned": true,
  "featured": "Vortice"
}
```

---

## banners.json

Array of banner objects. Each banner appears as a card in the Banners section with character/wheel art slices.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **yes** | Unique identifier. Convention: `banner-{short-name}` |
| `title` | string | **yes** | Display title |
| `type` | string | **yes** | Determines the type badge. See [Banner Types](#banner-types) below |
| `description` | string | no | Supports `\n` for line breaks and inline HTML (e.g. `<a href="...">link text</a>`) |
| `startDate` | string | **yes** | Start time in `YYYY/MM/DD HH:MM` UTC+8 |
| `endDate` | string | **yes** | End time in `YYYY/MM/DD HH:MM` UTC+8 |
| `pinned` | boolean | no | Pinned banners sort to the top |
| `featured` | array | no | List of featured units. See [Featured Units](#featured-units) |
| `poolSlots` | array | no | Rotating pool slots. See [Pool Slots](#pool-slots) |
| `customArt` | string | no | URL to custom banner art (future use) |

### Banner Types

| Type | Use For |
|------|---------|
| `awaken` | Standard awakening banners (usually 3 characters) |
| `limited` | Limited-time rate-up banners (1–2 characters) |
| `standard` | Permanent standard pool banners |
| `rerun` | Reruns of previous banners |
| `selector` | Pick-your-own-rate-up banners |
| `wheel` | Wheel-only banners |
| `combo` | Combo banners (mixed character + wheel pools) |

### Featured Units

The `featured` array lists the units shown as art slices on the banner card. Each item can be:

**A simple string** — the name is auto-detected as awakener or wheel:
```json
"featured": ["Tawil", "Miryam", "Heart of a Knight"]
```
- If the name matches a wheel in the database → rendered as wheel art
- Otherwise → rendered as awakener art (character card)

**An object with explicit kind** — use when auto-detect isn't enough:
```json
"featured": [
  "Hameln",
  { "name": "Hameln", "kind": "wheel-auto" }
]
```

| Kind | Meaning |
|------|---------|
| `"awakener"` | Character card art (default) |
| `"wheel"` | Wheel art — use the wheel's exact name |
| `"wheel-auto"` | Signature wheel — use the **awakener's** name and the code finds their signature wheel automatically |

A common pattern for solo rate-up banners (character + their wheel):
```json
"featured": [
  "Hameln",
  { "name": "Hameln", "kind": "wheel-auto" }
]
```

### Pool Slots

Pool slots create **rotating banner slices** that cycle through members with crossfade transitions. Use `poolSlots` instead of (or alongside) `featured` for banners where the user picks from a pool.

Each pool slot object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pool` | array | **yes** | Array of unit names/objects (same format as `featured` items) |
| `linked` | boolean | no | When `true`, this slot cycles in sync with other linked slots. Used for "pick one awakener and get their wheel" banners |
| `count` | number | no | Creates this many **identical copies** of the slot. Saves you from repeating the same pool array multiple times. Default: `1` |

**Example — 4-pick banner** (4 slots sharing the same pool):
```json
"poolSlots": [
  {
    "pool": ["Miryam", "Caecus", "Doresain", "Hameln", "Corposant", "Faint"],
    "count": 4
  }
]
```
This expands to 4 separate slots, each cycling through the same 6 awakeners. The display deduplicates so no two slots show the same unit at the same time.

**Example — linked selection** (pick awakener → get their wheel):
```json
"poolSlots": [
  {
    "pool": ["Faint", "Erica", "Kathigu-Ra"],
    "linked": true
  }
]
```
When `linked` is true, the code auto-expands to show the awakener and their signature wheel side by side, cycling together.

**Example — combo banner** (separate pools for characters and wheels):
```json
"poolSlots": [
  { "pool": ["Tawil", "Caecus", "Ogier"] },
  { "pool": ["Hameln", "Corposant", "Lotan"] },
  { "pool": ["Wheel Unseen", "Celestial Beast", "Amber-Tinted Death"] },
  { "pool": ["Eternal Requiem", "The Last Verse", "Core Meltdown"] }
]
```

### Full Banner Example

```json
{
  "id": "banner-arcane-tides",
  "title": "Awaken — Arcane Tides",
  "type": "awaken",
  "description": "Featured rate-up. <a href=\"https://discord.gg/example\" target=\"_blank\">Review on Discord</a>",
  "startDate": "2026/03/05 18:00",
  "endDate": "2026/03/19 11:59",
  "featured": ["Tawil", "Miryam", "Caecus"]
}
```
