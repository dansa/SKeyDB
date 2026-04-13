# Batch Refactoring of src/pages/database/ Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/pages/database/` to centralize shared constants/types and update internal utility imports.

**Architecture:** 
- Extract shared UI constants into `constants.ts`.
- Extract shared TypeScript types into `types.ts`.
- Move residual test files for moved utilities.
- Update all relative imports to use the new `utils/` subdirectory for moved utility files.

**Tech Stack:** TypeScript, React

---

### Task 1: Cleanup and Organization

**Files:**
- Move: `src/pages/database/popover-trail.test.ts` -> `src/pages/database/utils/popover-trail.test.ts`
- Create: `src/pages/database/constants.ts`
- Create: `src/pages/database/types.ts`

- [ ] **Step 1: Move popover-trail.test.ts**

Run: `mv src/pages/database/popover-trail.test.ts src/pages/database/utils/popover-trail.test.ts`

- [ ] **Step 2: Create src/pages/database/types.ts**

```typescript
export interface ModalGlowStop {
  position: string
  shape: 'circle' | 'ellipse'
  strength: number
  fade: number
  size?: string
}

export interface ModalGradientVariant {
  angle: number
  baseStrength: number
  vignetteStrength: number
  edgeGlowStrength: number
  glows: ModalGlowStop[]
}
```

- [ ] **Step 3: Create src/pages/database/constants.ts**

```typescript
import type {ModalGradientVariant} from './types'

export const TABS = [
  {id: 'cards', label: 'Skills'},
  {id: 'copies', label: 'Copies'},
  {id: 'talents', label: 'Talents'},
  {id: 'builds', label: 'Builds'},
  {id: 'teams', label: 'Teams'},
] as const

export type TabId = (typeof TABS)[number]['id']

export const MODAL_GRADIENT_VARIANTS: ModalGradientVariant[] = [
  {
    angle: 185,
    baseStrength: 5,
    vignetteStrength: 7,
    edgeGlowStrength: 7,
    glows: [
      {position: '12% 14%', shape: 'circle', strength: 7, fade: 58, size: '68% 68%'},
      {position: '84% 12%', shape: 'circle', strength: 5, fade: 52, size: '62% 62%'},
      {position: '56% 100%', shape: 'ellipse', strength: 5, fade: 66, size: '92% 42%'},
      {position: '38% 46%', shape: 'ellipse', strength: 3, fade: 54, size: '56% 34%'},
    ],
  },
  {
    angle: 158,
    baseStrength: 5,
    vignetteStrength: 7,
    edgeGlowStrength: 8,
    glows: [
      {position: '18% 12%', shape: 'ellipse', strength: 8, fade: 60, size: '78% 48%'},
      {position: '88% 18%', shape: 'circle', strength: 6, fade: 52, size: '58% 58%'},
      {position: '46% 76%', shape: 'ellipse', strength: 5, fade: 62, size: '82% 44%'},
      {position: '72% 54%', shape: 'circle', strength: 3, fade: 48, size: '42% 42%'},
    ],
  },
  {
    angle: 176,
    baseStrength: 5,
    vignetteStrength: 8,
    edgeGlowStrength: 8,
    glows: [
      {position: 'top left', shape: 'ellipse', strength: 7, fade: 62, size: '74% 44%'},
      {position: '74% 10%', shape: 'ellipse', strength: 6, fade: 52, size: '60% 34%'},
      {position: '54% 100%', shape: 'ellipse', strength: 6, fade: 66, size: '88% 40%'},
      {position: '18% 72%', shape: 'circle', strength: 3, fade: 50, size: '40% 40%'},
    ],
  },
]
```

### Task 2: Update AwakenerDetailModal.tsx

**Files:**
- Modify: `src/pages/database/AwakenerDetailModal.tsx`

- [ ] **Step 1: Update imports and remove local constants/types**

Replace the extracted constants and types with imports from `./constants` and `./types`.

- [ ] **Step 2: Update props and local state to use imported types**

Ensure `TabId` and `ModalGradientVariant` are correctly referenced.

### Task 3: Batch Update Utility Imports

**Files:**
- Modify: Multiple files in `src/pages/database/`

- [ ] **Step 1: Update `TagPopover.tsx`**
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 2: Update `SkillPopover.tsx`**
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 3: Update `ScalingPopover.tsx`**
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 4: Update `RichSegmentRenderer.tsx`**
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 5: Update `RichDescription.tsx`**
  - Change `./popover-trail` to `./utils/popover-trail`

- [ ] **Step 6: Update `PopoverTrailPanel.tsx`**
  - Change `./popover-trail` to `./utils/popover-trail`

- [ ] **Step 7: Update `src/pages/database/utils/popover-trail.test.ts` (moved)**
  - Change `./popover-trail` to `./popover-trail` (since it's now in the same directory)

- [ ] **Step 8: Update `DetailSection.tsx`**
  - Change `./font-scale` to `./utils/font-scale`
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 9: Update `DatabaseTabSection.tsx`**
  - Change `./font-scale` to `./utils/font-scale`
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 10: Update `AwakenerDetailOverview.tsx`**
  - Change `./font-scale` to `./utils/font-scale`

- [ ] **Step 11: Update `AwakenerDetailCards.tsx`**
  - Change `./font-scale` to `./utils/font-scale`
  - Change `./text-styles` to `./utils/text-styles`

- [ ] **Step 12: Update `AwakenerBuildsTab.tsx`**
  - Change `./font-scale` to `./utils/font-scale`
  - Change `./text-styles` to `./utils/text-styles`

### Task 4: Verification

- [ ] **Step 1: Run type check**
  Run: `npx tsc -p tsconfig.app.json --noEmit`

- [ ] **Step 2: Run tests in src/pages/database/**
  Run: `npx vitest src/pages/database/`
