import { useMemo } from 'react'
import { getAwakeners } from '../../domain/awakeners'
import { getAwakenerCardAsset } from '../../domain/awakener-assets'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import type { OwnedAwakenerBoxEntry } from './OwnedAwakenerBoxExport'

export function useOwnedAwakenerBoxEntries(
  getAwakenerOwnedLevel: (awakenerName: string) => number | null,
  getAwakenerLevel?: (awakenerName: string) => number,
): OwnedAwakenerBoxEntry[] {
  return useMemo(() => {
    const resolveAwakenerLevel = getAwakenerLevel ?? (() => 60)

    return getAwakeners()
      .flatMap((awakener) => {
        const level = getAwakenerOwnedLevel(awakener.name)
        if (level === null) {
          return []
        }
        return [
          {
            name: awakener.name,
            displayName: formatAwakenerNameForUi(awakener.name),
            level,
            awakenerLevel: resolveAwakenerLevel(awakener.name),
            cardAsset: getAwakenerCardAsset(awakener.name) ?? null,
          },
        ]
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
  }, [getAwakenerOwnedLevel, getAwakenerLevel])
}

