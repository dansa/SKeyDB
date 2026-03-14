import {useMemo, useState} from 'react'

import {getAwakeners} from '@/domain/awakeners'
import {loadCollectionOwnership} from '@/domain/collection-ownership'
import {getPosses} from '@/domain/posses'
import {getBrowserLocalStorage} from '@/domain/storage'
import {getWheels} from '@/domain/wheels'

const awakeners = getAwakeners()
const wheels = getWheels()
const posses = getPosses()

const awakenerIdByName = new Map(awakeners.map((a) => [a.name, String(a.id)]))

export function useCollectionOwnership() {
  const [ownership] = useState(() => loadCollectionOwnership(getBrowserLocalStorage()))

  const ownedAwakenerLevelByName = useMemo(
    () =>
      new Map(
        awakeners.map((awakener) => {
          const awakenerId = awakenerIdByName.get(awakener.name)
          const level =
            awakenerId !== undefined && awakenerId in ownership.ownedAwakeners
              ? ownership.ownedAwakeners[awakenerId]
              : null
          return [awakener.name, level] as const
        }),
      ),
    [ownership.ownedAwakeners],
  )

  const awakenerLevelByName = useMemo(
    () =>
      new Map(
        awakeners.map((awakener) => {
          const awakenerId = awakenerIdByName.get(awakener.name)
          const level =
            awakenerId !== undefined && awakenerId in ownership.awakenerLevels
              ? ownership.awakenerLevels[awakenerId]
              : 60
          return [awakener.name, level] as const
        }),
      ),
    [ownership.awakenerLevels],
  )

  const ownedWheelLevelById = useMemo(
    () =>
      new Map(
        wheels.map(
          (wheel) =>
            [
              wheel.id,
              wheel.id in ownership.ownedWheels ? ownership.ownedWheels[wheel.id] : null,
            ] as const,
        ),
      ),
    [ownership.ownedWheels],
  )

  const ownedPosseLevelById = useMemo(
    () =>
      new Map(
        posses.map(
          (posse) =>
            [
              posse.id,
              posse.id in ownership.ownedPosses ? ownership.ownedPosses[posse.id] : null,
            ] as const,
        ),
      ),
    [ownership.ownedPosses],
  )

  return {
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
  }
}
