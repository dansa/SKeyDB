import {useBuilderStore} from './store/builder-store'

export function useCollectionOwnership() {
  const ownedAwakenerLevelByName = useBuilderStore((state) => state.ownedAwakenerLevelByName)
  const awakenerLevelByName = useBuilderStore((state) => state.awakenerLevelByName)
  const ownedWheelLevelById = useBuilderStore((state) => state.ownedWheelLevelById)
  const ownedPosseLevelById = useBuilderStore((state) => state.ownedPosseLevelById)

  return {
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
  }
}
