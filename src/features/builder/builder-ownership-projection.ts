import type {Awakener} from '@/domain/awakeners'
import type {CollectionOwnershipState} from '@/domain/collection-ownership'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

export interface BuilderOwnershipProjection {
  ownedAwakenerLevelByName: Map<string, number | null>
  awakenerLevelByName: Map<string, number>
  ownedWheelLevelById: Map<string, number | null>
  ownedPosseLevelById: Map<string, number | null>
  isAwakenerOwnedByName: (awakenerName: string) => boolean
  isWheelOwnedById: (wheelId: string) => boolean
  isPosseOwnedById: (posseId: string) => boolean
}

export function createBuilderOwnershipProjection({
  awakeners,
  wheels,
  posses,
  ownership,
}: {
  awakeners: readonly Awakener[]
  wheels: readonly Wheel[]
  posses: readonly Posse[]
  ownership: CollectionOwnershipState
}): BuilderOwnershipProjection {
  const awakenerIdByName = new Map(awakeners.map((awakener) => [awakener.name, awakener.id]))
  const ownedAwakenerLevelByName = new Map(
    awakeners.map((awakener) => {
      const awakenerId = awakenerIdByName.get(awakener.name)
      const level =
        typeof awakenerId === 'string' ? (ownership.ownedAwakeners[awakenerId] ?? null) : null
      return [awakener.name, level]
    }),
  )
  const awakenerLevelByName = new Map(
    awakeners.map((awakener) => {
      const awakenerId = awakenerIdByName.get(awakener.name)
      const level =
        typeof awakenerId === 'string' ? (ownership.awakenerLevels[awakenerId] ?? 60) : 60
      return [awakener.name, level]
    }),
  )
  const ownedWheelLevelById = new Map(
    wheels.map((wheel) => [wheel.id, ownership.ownedWheels[wheel.id] ?? null]),
  )
  const ownedPosseLevelById = new Map(
    posses.map((posse) => [posse.id, ownership.ownedPosses[posse.id] ?? null]),
  )

  return {
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    isAwakenerOwnedByName: (awakenerName) =>
      (ownedAwakenerLevelByName.get(awakenerName) ?? null) !== null,
    isWheelOwnedById: (wheelId) => (ownedWheelLevelById.get(wheelId) ?? null) !== null,
    isPosseOwnedById: (posseId) => (ownedPosseLevelById.get(posseId) ?? null) !== null,
  }
}
