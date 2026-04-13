import {produce} from 'immer'
import {create} from 'zustand'

import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
} from '@/domain/awakener-level-scaling'
import type {TabId} from '@/pages/database/constants'
import {readFontScale, writeFontScale, type FontScale} from '@/pages/database/utils/font-scale'
import {
  readAwakenerDetailSettings,
  writeAwakenerDetailSettings,
} from '@/pages/database/utils/modal-persistence'

interface AwakenerDetailModalStoreState {
  activeAwakenerId: number | null
  activeTab: TabId
  awakenerLevel: number
  psycheSurgeOffset: number
  skillLevel: number
  fontScale: FontScale
  isScalingMenuOpen: boolean
  isTagsMenuOpen: boolean
}

interface AwakenerDetailModalStoreActions {
  initialize: (awakenerId: number) => void
  setActiveTab: (tab: TabId) => void
  setAwakenerLevel: (level: number) => void
  setPsycheSurgeOffset: (offset: number) => void
  setSkillLevel: (level: number) => void
  setFontScale: (fontScale: FontScale) => void
  toggleScalingMenu: () => void
  toggleTagsMenu: () => void
  closeScalingMenu: () => void
  closeTagsMenu: () => void
  closeMenus: () => void
  reset: () => void
}

type AwakenerDetailModalStore = AwakenerDetailModalStoreState & AwakenerDetailModalStoreActions

const BASE_MODAL_UI_STATE: Omit<AwakenerDetailModalStoreState, 'fontScale' | 'activeAwakenerId'> = {
  activeTab: 'cards',
  awakenerLevel: 60,
  psycheSurgeOffset: 0,
  skillLevel: 1,
  isScalingMenuOpen: false,
  isTagsMenuOpen: false,
}

function buildInitialState(): AwakenerDetailModalStoreState {
  return {
    ...BASE_MODAL_UI_STATE,
    activeAwakenerId: null,
    fontScale: readFontScale(),
  }
}

function updateAwakenerDetailModalStore(
  set: (
    partial:
      | Partial<AwakenerDetailModalStore>
      | ((state: AwakenerDetailModalStore) => Partial<AwakenerDetailModalStore>),
  ) => void,
  recipe: (draft: AwakenerDetailModalStoreState) => void,
): void {
  set(
    produce((state: AwakenerDetailModalStore) => {
      recipe(state)
    }),
  )
}

export const useAwakenerDetailModalStore = create<AwakenerDetailModalStore>()((set) => ({
  ...buildInitialState(),
  initialize: (awakenerId) => {
    const settings = readAwakenerDetailSettings(awakenerId)
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.activeAwakenerId = awakenerId
      draft.activeTab = 'cards'
      draft.awakenerLevel = settings.awakenerLevel ?? BASE_MODAL_UI_STATE.awakenerLevel
      draft.psycheSurgeOffset = settings.psycheSurgeOffset ?? BASE_MODAL_UI_STATE.psycheSurgeOffset
      draft.skillLevel = settings.skillLevel ?? BASE_MODAL_UI_STATE.skillLevel
      draft.isScalingMenuOpen = false
      draft.isTagsMenuOpen = false
    })
  },
  setActiveTab: (tab) => {
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.activeTab = tab
    })
  },
  setAwakenerLevel: (level) => {
    const clampedLevel = clampAwakenerDatabaseLevel(level)
    set((state) => {
      if (state.activeAwakenerId !== null) {
        writeAwakenerDetailSettings(state.activeAwakenerId, {awakenerLevel: clampedLevel})
      }
      return {awakenerLevel: clampedLevel}
    })
  },
  setPsycheSurgeOffset: (offset) => {
    const clampedOffset = clampAwakenerDatabasePsycheSurgeOffset(offset)
    set((state) => {
      if (state.activeAwakenerId !== null) {
        writeAwakenerDetailSettings(state.activeAwakenerId, {psycheSurgeOffset: clampedOffset})
      }
      return {psycheSurgeOffset: clampedOffset}
    })
  },
  setSkillLevel: (level) => {
    set((state) => {
      if (state.activeAwakenerId !== null) {
        writeAwakenerDetailSettings(state.activeAwakenerId, {skillLevel: level})
      }
      return {skillLevel: level}
    })
  },
  setFontScale: (fontScale) => {
    writeFontScale(fontScale)
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.fontScale = fontScale
    })
  },
  toggleScalingMenu: () => {
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.isScalingMenuOpen = !draft.isScalingMenuOpen
    })
  },
  toggleTagsMenu: () => {
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.isTagsMenuOpen = !draft.isTagsMenuOpen
    })
  },
  closeScalingMenu: () => {
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.isScalingMenuOpen = false
    })
  },
  closeTagsMenu: () => {
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.isTagsMenuOpen = false
    })
  },
  closeMenus: () => {
    updateAwakenerDetailModalStore(set, (draft) => {
      draft.isScalingMenuOpen = false
      draft.isTagsMenuOpen = false
    })
  },
  reset: () => {
    updateAwakenerDetailModalStore(set, (draft) => {
      Object.assign(draft, buildInitialState())
    })
  },
}))

export function resetAwakenerDetailModalStore(): void {
  useAwakenerDetailModalStore.getState().reset()
}
