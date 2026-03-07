import {useCallback, useEffect, useState, type RefObject} from 'react'

import type {AwakenerSortKey, CollectionSortDirection} from '@/domain/collection-sorting'
import {safeStorageRead, safeStorageWrite, type StorageLike} from '@/domain/storage'

import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  TeamPreviewMode,
  WheelMainstatFilter,
  WheelRarityFilter,
} from './types'
import {useGlobalPickerSearchCapture} from './useGlobalPickerSearchCapture'

const BUILDER_AWAKENER_SORT_KEY_KEY = 'skeydb.builder.awakenerSortKey.v1'
const BUILDER_AWAKENER_SORT_DIRECTION_KEY = 'skeydb.builder.awakenerSortDirection.v1'
const BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY = 'skeydb.builder.awakenerSortGroupByFaction.v1'
const BUILDER_DISPLAY_UNOWNED_KEY = 'skeydb.builder.displayUnowned.v1'
const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'
const BUILDER_TEAM_PREVIEW_MODE_KEY = 'skeydb.builder.teamPreviewMode.v1'

interface UseBuilderPreferencesOptions {
  searchInputRef: RefObject<HTMLInputElement | null>
  storage: StorageLike | null
}

export function useBuilderPreferences({searchInputRef, storage}: UseBuilderPreferencesOptions) {
  const [pickerTab, setPickerTab] = useState<PickerTab>('awakeners')
  const [awakenerFilter, setAwakenerFilter] = useState<AwakenerFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<PosseFilter>('ALL')
  const [wheelRarityFilter, setWheelRarityFilter] = useState<WheelRarityFilter>('ALL')
  const [wheelMainstatFilter, setWheelMainstatFilter] = useState<WheelMainstatFilter>('ALL')
  const [awakenerSortKey, setAwakenerSortKey] = useState<AwakenerSortKey>(() => {
    const stored = safeStorageRead(storage, BUILDER_AWAKENER_SORT_KEY_KEY)
    if (
      stored === 'LEVEL' ||
      stored === 'RARITY' ||
      stored === 'ENLIGHTEN' ||
      stored === 'ALPHABETICAL'
    ) {
      return stored
    }
    return 'LEVEL'
  })
  const [awakenerSortDirection, setAwakenerSortDirection] = useState<CollectionSortDirection>(
    () => {
      return safeStorageRead(storage, BUILDER_AWAKENER_SORT_DIRECTION_KEY) === 'ASC'
        ? 'ASC'
        : 'DESC'
    },
  )
  const [awakenerSortGroupByRealm, setAwakenerSortGroupByRealm] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY)
    if (stored === '1') {
      return true
    }
    if (stored === '0') {
      return false
    }
    return true
  })
  const [pickerSearchByTab, setPickerSearchByTab] = useState<Record<PickerTab, string>>({
    awakeners: '',
    wheels: '',
    posses: '',
    covenants: '',
  })
  const [displayUnowned, setDisplayUnowned] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_DISPLAY_UNOWNED_KEY)
    if (stored === '1') {
      return true
    }
    if (stored === '0') {
      return false
    }
    return true
  })
  const [allowDupes, setAllowDupes] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_ALLOW_DUPES_KEY)
    if (stored === '1') {
      return true
    }
    if (stored === '0') {
      return false
    }
    return false
  })
  const [teamPreviewMode, setTeamPreviewMode] = useState<TeamPreviewMode>(() => {
    const stored = safeStorageRead(storage, BUILDER_TEAM_PREVIEW_MODE_KEY)
    if (stored === 'compact' || stored === 'expanded') {
      return stored
    }
    return 'compact'
  })

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY,
      awakenerSortGroupByRealm ? '1' : '0',
    )
  }, [storage, awakenerSortGroupByRealm])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_AWAKENER_SORT_KEY_KEY, awakenerSortKey)
  }, [storage, awakenerSortKey])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_AWAKENER_SORT_DIRECTION_KEY, awakenerSortDirection)
  }, [storage, awakenerSortDirection])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_DISPLAY_UNOWNED_KEY, displayUnowned ? '1' : '0')
  }, [storage, displayUnowned])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_ALLOW_DUPES_KEY, allowDupes ? '1' : '0')
  }, [storage, allowDupes])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_TEAM_PREVIEW_MODE_KEY, teamPreviewMode)
  }, [storage, teamPreviewMode])

  const appendSearchCharacter = useCallback((targetPickerTab: PickerTab, key: string) => {
    setPickerSearchByTab((prev) => ({
      ...prev,
      [targetPickerTab]: `${prev[targetPickerTab]}${key}`,
    }))
  }, [])

  useGlobalPickerSearchCapture({
    pickerTab,
    searchInputRef,
    onAppendCharacter: appendSearchCharacter,
  })

  return {
    pickerTab,
    setPickerTab,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection: () => {
      setAwakenerSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
    },
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    pickerSearchByTab,
    setPickerSearchByTab,
    displayUnowned,
    setDisplayUnowned,
    allowDupes,
    setAllowDupes,
    teamPreviewMode,
    setTeamPreviewMode,
  }
}
