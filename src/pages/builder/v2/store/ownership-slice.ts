import {getAwakeners} from '@/domain/awakeners'
import {
  COLLECTION_OWNERSHIP_KEY,
  loadCollectionOwnership,
  type CollectionOwnershipState,
} from '@/domain/collection-ownership'
import {getPosses} from '@/domain/posses'
import {getBrowserLocalStorage} from '@/domain/storage'
import {getWheels} from '@/domain/wheels'

import type {BuilderSet, OwnershipSlice} from './types'

const awakeners = getAwakeners()
const wheels = getWheels()
const posses = getPosses()

const awakenerIdByName = new Map(awakeners.map((awakener) => [awakener.name, String(awakener.id)]))

interface OwnershipMaps {
  ownedAwakenerLevelByName: OwnershipSlice['ownedAwakenerLevelByName']
  awakenerLevelByName: OwnershipSlice['awakenerLevelByName']
  ownedWheelLevelById: OwnershipSlice['ownedWheelLevelById']
  ownedPosseLevelById: OwnershipSlice['ownedPosseLevelById']
}

function buildOwnershipMaps(ownership: CollectionOwnershipState): OwnershipMaps {
  return {
    ownedAwakenerLevelByName: new Map(
      awakeners.map((awakener) => {
        const awakenerId = awakenerIdByName.get(awakener.name)
        const level =
          awakenerId !== undefined && awakenerId in ownership.ownedAwakeners
            ? ownership.ownedAwakeners[awakenerId]
            : null
        return [awakener.name, level] as const
      }),
    ),
    awakenerLevelByName: new Map(
      awakeners.map((awakener) => {
        const awakenerId = awakenerIdByName.get(awakener.name)
        const level =
          awakenerId !== undefined && awakenerId in ownership.awakenerLevels
            ? ownership.awakenerLevels[awakenerId]
            : 60
        return [awakener.name, level] as const
      }),
    ),
    ownedWheelLevelById: new Map(
      wheels.map(
        (wheel) =>
          [
            wheel.id,
            wheel.id in ownership.ownedWheels ? ownership.ownedWheels[wheel.id] : null,
          ] as const,
      ),
    ),
    ownedPosseLevelById: new Map(
      posses.map(
        (posse) =>
          [
            posse.id,
            posse.id in ownership.ownedPosses ? ownership.ownedPosses[posse.id] : null,
          ] as const,
      ),
    ),
  }
}

function loadOwnershipMaps(): OwnershipMaps {
  return buildOwnershipMaps(loadCollectionOwnership(getBrowserLocalStorage()))
}

export function createOwnershipSlice(set: BuilderSet): OwnershipSlice {
  const initial = loadOwnershipMaps()

  return {
    ...initial,

    refreshCollectionOwnership: () => {
      const next = loadOwnershipMaps()
      set((state) => {
        state.ownedAwakenerLevelByName = next.ownedAwakenerLevelByName
        state.awakenerLevelByName = next.awakenerLevelByName
        state.ownedWheelLevelById = next.ownedWheelLevelById
        state.ownedPosseLevelById = next.ownedPosseLevelById
      })
    },
  }
}

export function subscribeCollectionOwnership(store: {
  getState: () => Pick<OwnershipSlice, 'refreshCollectionOwnership'>
}): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== COLLECTION_OWNERSHIP_KEY) {
      return
    }
    store.getState().refreshCollectionOwnership()
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener('storage', handleStorage)
  }
}
