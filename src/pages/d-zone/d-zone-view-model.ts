import {
  getDzoneSeasonSharedInitialRelicIds,
  resolveDzoneWaveViewModel,
  type DzoneResolvedWave,
  type DzoneSeason,
} from '@/domain/dzone'
import {getRelicAssetByAssetId} from '@/domain/relic-assets'
import {getRelicById} from '@/domain/relics'

export interface DZoneRelicPreview {
  iconSrc?: string
  id: string
  name: string
}

export interface DZoneWaveCardViewModel {
  relics: DZoneRelicPreview[]
  wave: DzoneResolvedWave
}

function buildRelicPreview(relicId: string): DZoneRelicPreview {
  const relic = getRelicById(relicId)
  return {
    id: relicId,
    name: relic?.name ?? relicId,
    iconSrc: relic?.assetId ? getRelicAssetByAssetId(relic.assetId) : undefined,
  }
}

function getSharedInitialRelicRank(relicId: string, sharedRelicIds: string[]): number {
  const sharedIndex = sharedRelicIds.indexOf(relicId)
  return sharedIndex === -1 ? Number.MAX_SAFE_INTEGER : sharedIndex
}

export function sortInitialRelicIds(relicIds: string[], sharedRelicIds: string[]): string[] {
  return [...relicIds].sort((left, right) => {
    const rankDiff =
      getSharedInitialRelicRank(left, sharedRelicIds) -
      getSharedInitialRelicRank(right, sharedRelicIds)
    return rankDiff !== 0 ? rankDiff : relicIds.indexOf(left) - relicIds.indexOf(right)
  })
}

export function buildDZoneWaveCardViewModels(season: DzoneSeason): DZoneWaveCardViewModel[] {
  const sharedInitialRelicIds = getDzoneSeasonSharedInitialRelicIds(season)

  return season.waves.map((wave) => ({
    wave: resolveDzoneWaveViewModel(wave),
    relics: sortInitialRelicIds(wave.initialRelicIds, sharedInitialRelicIds).map(buildRelicPreview),
  }))
}
