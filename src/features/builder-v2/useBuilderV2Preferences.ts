import {useCallback, useEffect, useMemo, useState} from 'react'

import {
  resolveAwakenerSortKey,
  type AwakenerSortKey,
  type CollectionSortDirection,
  type WheelCollectionSortKey,
} from '@/domain/collection-sorting'
import {getBrowserLocalStorage, safeStorageRead, safeStorageWrite} from '@/domain/storage'

import type {TeamPreviewMode} from '../builder/types'

const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'
const BUILDER_AWAKENER_SORT_KEY_KEY = 'skeydb.builder.awakenerSortKey.v1'
const BUILDER_AWAKENER_SORT_DIRECTION_KEY = 'skeydb.builder.awakenerSortDirection.v1'
const BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY = 'skeydb.builder.awakenerSortGroupByFaction.v1'
const BUILDER_DISPLAY_UNOWNED_KEY = 'skeydb.builder.displayUnowned.v1'
const BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY = 'skeydb.builder.promoteRecommendedGear.v1'
const BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY =
  'skeydb.builder.promoteMatchingWheelMainstats.v1'
const BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY = 'skeydb.builder.sinkUnownedToBottom.v1'
const BUILDER_V2_WHEEL_SORT_KEY_KEY = 'skeydb.builderV2.wheelSortKey.v1'
const BUILDER_V2_WHEEL_SORT_DIRECTION_KEY = 'skeydb.builderV2.wheelSortDirection.v1'
const BUILDER_V2_TEAM_PREVIEW_MODE_KEY = 'skeydb.builderV2.teamPreviewMode.v1'

export function useBuilderV2Preferences() {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [allowDuplicateAwakenerIdentities, setAllowDuplicateAwakenerIdentities] = useState(
    () => safeStorageRead(storage, BUILDER_ALLOW_DUPES_KEY) === '1',
  )
  const [displayUnowned, setDisplayUnowned] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_DISPLAY_UNOWNED_KEY)
    return stored === '0' ? false : true
  })
  const [sinkUnownedToBottom, setSinkUnownedToBottom] = useState(
    () => safeStorageRead(storage, BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY) === '1',
  )
  const [promoteRecommendedGear, setPromoteRecommendedGear] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY)
    return stored === '0' ? false : true
  })
  const [promoteMatchingWheelMainstats, setPromoteMatchingWheelMainstats] = useState(
    () => safeStorageRead(storage, BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY) === '1',
  )
  const [awakenerSortKey, setAwakenerSortKey] = useState<AwakenerSortKey>(() =>
    resolveAwakenerSortKey(safeStorageRead(storage, BUILDER_AWAKENER_SORT_KEY_KEY)),
  )
  const [awakenerSortDirection, setAwakenerSortDirection] = useState<CollectionSortDirection>(() =>
    safeStorageRead(storage, BUILDER_AWAKENER_SORT_DIRECTION_KEY) === 'ASC' ? 'ASC' : 'DESC',
  )
  const [awakenerSortGroupByRealm, setAwakenerSortGroupByRealm] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY)
    return stored === '0' ? false : true
  })
  const [wheelSortKey, setWheelSortKey] = useState<WheelCollectionSortKey>(() =>
    resolveWheelSortKey(safeStorageRead(storage, BUILDER_V2_WHEEL_SORT_KEY_KEY)),
  )
  const [wheelSortDirection, setWheelSortDirection] = useState<CollectionSortDirection>(() =>
    safeStorageRead(storage, BUILDER_V2_WHEEL_SORT_DIRECTION_KEY) === 'ASC' ? 'ASC' : 'DESC',
  )
  const [teamPreviewMode, setTeamPreviewModeState] = useState<TeamPreviewMode>(() =>
    safeStorageRead(storage, BUILDER_V2_TEAM_PREVIEW_MODE_KEY) === 'expanded'
      ? 'expanded'
      : 'compact',
  )

  const toggleAwakenerSortDirection = useCallback(() => {
    setAwakenerSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
  }, [])

  const toggleWheelSortDirection = useCallback(() => {
    setWheelSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
  }, [])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_ALLOW_DUPES_KEY, allowDuplicateAwakenerIdentities ? '1' : '0')
  }, [allowDuplicateAwakenerIdentities, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_DISPLAY_UNOWNED_KEY, displayUnowned ? '1' : '0')
  }, [displayUnowned, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY, sinkUnownedToBottom ? '1' : '0')
  }, [sinkUnownedToBottom, storage])

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY,
      promoteRecommendedGear ? '1' : '0',
    )
  }, [promoteRecommendedGear, storage])

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY,
      promoteMatchingWheelMainstats ? '1' : '0',
    )
  }, [promoteMatchingWheelMainstats, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_AWAKENER_SORT_KEY_KEY, awakenerSortKey)
  }, [awakenerSortKey, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_AWAKENER_SORT_DIRECTION_KEY, awakenerSortDirection)
  }, [awakenerSortDirection, storage])

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY,
      awakenerSortGroupByRealm ? '1' : '0',
    )
  }, [awakenerSortGroupByRealm, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_V2_WHEEL_SORT_KEY_KEY, wheelSortKey)
  }, [storage, wheelSortKey])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_V2_WHEEL_SORT_DIRECTION_KEY, wheelSortDirection)
  }, [storage, wheelSortDirection])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_V2_TEAM_PREVIEW_MODE_KEY, teamPreviewMode)
  }, [storage, teamPreviewMode])

  return {
    allowDuplicateAwakenerIdentities,
    setAllowDuplicateAwakenerIdentities,
    displayUnowned,
    setDisplayUnowned,
    sinkUnownedToBottom,
    setSinkUnownedToBottom,
    promoteRecommendedGear,
    setPromoteRecommendedGear,
    promoteMatchingWheelMainstats,
    setPromoteMatchingWheelMainstats,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    wheelSortKey,
    setWheelSortKey,
    wheelSortDirection,
    toggleWheelSortDirection,
    teamPreviewMode,
    setTeamPreviewMode: setTeamPreviewModeState,
  }
}

function resolveWheelSortKey(value: unknown): WheelCollectionSortKey {
  return value === 'ALPHABETICAL' ||
    value === 'RARITY' ||
    value === 'REALM' ||
    value === 'MAINSTAT' ||
    value === 'ENLIGHTEN'
    ? value
    : 'RARITY'
}
