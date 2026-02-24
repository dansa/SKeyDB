import { useMemo } from 'react'
import { getWheelAssetById } from '../../domain/wheel-assets'
import { compareWheelsForUi } from '../../domain/wheel-sort'
import { getWheels } from '../../domain/wheels'
import type { OwnedWheelBoxEntry } from './OwnedWheelBoxExport'

export function useOwnedWheelBoxEntries(
  getWheelOwnedLevel: (wheelId: string) => number | null,
): OwnedWheelBoxEntry[] {
  return useMemo(() => {
    return [...getWheels()]
      .sort(compareWheelsForUi)
      .flatMap((wheel, index) => {
        const level = getWheelOwnedLevel(wheel.id)
        if (level === null) {
          return []
        }
        return [
          {
            id: wheel.id,
            name: wheel.name,
            rarity: wheel.rarity,
            faction: wheel.faction,
            index,
            level,
            wheelAsset: getWheelAssetById(wheel.id) ?? null,
          },
        ]
      })
  }, [getWheelOwnedLevel])
}
