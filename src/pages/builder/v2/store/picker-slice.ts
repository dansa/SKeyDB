import type {AwakenerSortKey, CollectionSortDirection} from '@/domain/collection-sorting'
import {getBrowserLocalStorage, safeStorageRead, safeStorageWrite} from '@/domain/storage'

import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  WheelMainstatFilter,
  WheelRarityFilter,
} from '../../types'
import type {BuilderSet, PickerSlice} from './types'

const BUILDER_AWAKENER_SORT_KEY_KEY = 'skeydb.builder.awakenerSortKey.v1'
const BUILDER_AWAKENER_SORT_DIRECTION_KEY = 'skeydb.builder.awakenerSortDirection.v1'
const BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY = 'skeydb.builder.awakenerSortGroupByFaction.v1'
const BUILDER_DISPLAY_UNOWNED_KEY = 'skeydb.builder.displayUnowned.v1'
const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'
const BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY = 'skeydb.builder.promoteRecommendedGear.v1'
const BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY =
  'skeydb.builder.promoteMatchingWheelMainstats.v1'
const BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY = 'skeydb.builder.sinkUnownedToBottom.v1'

function getStorage() {
  return getBrowserLocalStorage()
}

function readBoolean(key: string, fallback: boolean): boolean {
  const stored = safeStorageRead(getStorage(), key)
  if (stored === '1') {
    return true
  }
  if (stored === '0') {
    return false
  }
  return fallback
}

function persistBoolean(key: string, value: boolean) {
  safeStorageWrite(getStorage(), key, value ? '1' : '0')
}

function readAwakenerSortKey(): AwakenerSortKey {
  const stored = safeStorageRead(getStorage(), BUILDER_AWAKENER_SORT_KEY_KEY)
  if (
    stored === 'LEVEL' ||
    stored === 'RARITY' ||
    stored === 'ENLIGHTEN' ||
    stored === 'ALPHABETICAL'
  ) {
    return stored
  }
  return 'LEVEL'
}

function readAwakenerSortDirection(): CollectionSortDirection {
  return safeStorageRead(getStorage(), BUILDER_AWAKENER_SORT_DIRECTION_KEY) === 'ASC'
    ? 'ASC'
    : 'DESC'
}

function createInitialPickerState(): Pick<
  PickerSlice,
  | 'pickerTab'
  | 'pickerSearchByTab'
  | 'awakenerFilter'
  | 'posseFilter'
  | 'wheelRarityFilter'
  | 'wheelMainstatFilter'
  | 'awakenerSortKey'
  | 'awakenerSortDirection'
  | 'awakenerSortGroupByRealm'
  | 'displayUnowned'
  | 'sinkUnownedToBottom'
  | 'allowDupes'
  | 'promoteRecommendedGear'
  | 'promoteMatchingWheelMainstats'
> {
  return {
    pickerTab: 'awakeners',
    pickerSearchByTab: {
      awakeners: '',
      wheels: '',
      posses: '',
      covenants: '',
    },
    awakenerFilter: 'ALL',
    posseFilter: 'ALL',
    wheelRarityFilter: 'ALL',
    wheelMainstatFilter: 'ALL',
    awakenerSortKey: readAwakenerSortKey(),
    awakenerSortDirection: readAwakenerSortDirection(),
    awakenerSortGroupByRealm: readBoolean(BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY, true),
    displayUnowned: readBoolean(BUILDER_DISPLAY_UNOWNED_KEY, true),
    sinkUnownedToBottom: readBoolean(BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY, false),
    allowDupes: readBoolean(BUILDER_ALLOW_DUPES_KEY, false),
    promoteRecommendedGear: readBoolean(BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY, true),
    promoteMatchingWheelMainstats: readBoolean(BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY, false),
  }
}

function setPickerSearchByTab(state: PickerSlice, tab: PickerTab, query: string) {
  state.pickerSearchByTab[tab] = query
}

function setAwakenerFilterState(state: PickerSlice, filter: AwakenerFilter) {
  state.awakenerFilter = filter
}

function setPosseFilterState(state: PickerSlice, filter: PosseFilter) {
  state.posseFilter = filter
}

function setWheelRarityFilterState(state: PickerSlice, filter: WheelRarityFilter) {
  state.wheelRarityFilter = filter
}

function setWheelMainstatFilterState(state: PickerSlice, filter: WheelMainstatFilter) {
  state.wheelMainstatFilter = filter
}

export function createPickerSlice(set: BuilderSet): PickerSlice {
  const initial = createInitialPickerState()

  return {
    ...initial,

    setPickerTab: (tab: PickerTab) => {
      set((state) => {
        state.pickerTab = tab
      })
    },

    setPickerSearchQuery: (tab: PickerTab, query: string) => {
      set((state) => {
        setPickerSearchByTab(state, tab, query)
      })
    },

    setAwakenerFilter: (filter: AwakenerFilter) => {
      set((state) => {
        setAwakenerFilterState(state, filter)
      })
    },

    setPosseFilter: (filter: PosseFilter) => {
      set((state) => {
        setPosseFilterState(state, filter)
      })
    },

    setWheelRarityFilter: (filter: WheelRarityFilter) => {
      set((state) => {
        setWheelRarityFilterState(state, filter)
      })
    },

    setWheelMainstatFilter: (filter: WheelMainstatFilter) => {
      set((state) => {
        setWheelMainstatFilterState(state, filter)
      })
    },

    setAwakenerSortKey: (key: AwakenerSortKey) => {
      set((state) => {
        state.awakenerSortKey = key
      })
      safeStorageWrite(getStorage(), BUILDER_AWAKENER_SORT_KEY_KEY, key)
    },

    toggleAwakenerSortDirection: () => {
      let nextDirection: CollectionSortDirection = 'DESC'
      set((state) => {
        nextDirection = state.awakenerSortDirection === 'DESC' ? 'ASC' : 'DESC'
        state.awakenerSortDirection = nextDirection
      })
      safeStorageWrite(getStorage(), BUILDER_AWAKENER_SORT_DIRECTION_KEY, nextDirection)
    },

    setAwakenerSortGroupByRealm: (value: boolean) => {
      set((state) => {
        state.awakenerSortGroupByRealm = value
      })
      persistBoolean(BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY, value)
    },

    setDisplayUnowned: (value: boolean) => {
      set((state) => {
        state.displayUnowned = value
      })
      persistBoolean(BUILDER_DISPLAY_UNOWNED_KEY, value)
    },

    setSinkUnownedToBottom: (value: boolean) => {
      set((state) => {
        state.sinkUnownedToBottom = value
      })
      persistBoolean(BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY, value)
    },

    setAllowDupes: (allowDupes: boolean) => {
      set((state) => {
        state.allowDupes = allowDupes
      })
      persistBoolean(BUILDER_ALLOW_DUPES_KEY, allowDupes)
    },

    setPromoteRecommendedGear: (value: boolean) => {
      set((state) => {
        state.promoteRecommendedGear = value
      })
      persistBoolean(BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY, value)
    },

    setPromoteMatchingWheelMainstats: (value: boolean) => {
      set((state) => {
        state.promoteMatchingWheelMainstats = value
      })
      persistBoolean(BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY, value)
    },
  }
}
