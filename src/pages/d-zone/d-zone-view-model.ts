import {
  getDzoneSeasonSharedInitialRelicIds,
  getDzoneWaveInitialRelicReferences,
  resolveDzoneWaveViewModel,
  type DzoneInitialRelicReference,
  type DzoneResolvedWave,
  type DzoneSeason,
} from '@/domain/dzone'
import {getRelicAssetByAssetId} from '@/domain/relic-assets'
import {getRelicById} from '@/domain/relics'

export interface DZoneRelicPreview {
  iconSrc?: string
  id: string
  variantId: string
  name: string
}

export interface DZoneWaveCardViewModel {
  relics: DZoneRelicPreview[]
  wave: DzoneResolvedWave
}

function buildRelicPreview(reference: DzoneInitialRelicReference): DZoneRelicPreview {
  const relic = getRelicById(reference.relicId)
  if (!relic) {
    throw new Error(`D-Zone references unknown relic family "${reference.relicId}".`)
  }
  return {
    id: reference.relicId,
    variantId: reference.variantId,
    name: relic.name,
    iconSrc: relic.assetId ? getRelicAssetByAssetId(relic.assetId) : undefined,
  }
}

function getSharedInitialRelicRank(relicId: string, sharedRelicIds: string[]): number {
  const sharedIndex = sharedRelicIds.indexOf(relicId)
  return sharedIndex === -1 ? Number.MAX_SAFE_INTEGER : sharedIndex
}

export function sortInitialRelicIds(relicIds: string[], sharedRelicIds: string[]): string[] {
  return relicIds.toSorted((left, right) => {
    const rankDiff =
      getSharedInitialRelicRank(left, sharedRelicIds) -
      getSharedInitialRelicRank(right, sharedRelicIds)
    return rankDiff !== 0 ? rankDiff : relicIds.indexOf(left) - relicIds.indexOf(right)
  })
}

export function buildDZoneWaveCardViewModels(season: DzoneSeason): DZoneWaveCardViewModel[] {
  const sharedInitialRelicIds = getDzoneSeasonSharedInitialRelicIds(season)

  return season.waves.map((wave) => {
    const referencesByRelicId = new Map(
      getDzoneWaveInitialRelicReferences(wave).map((reference) => [reference.relicId, reference]),
    )
    const relics = sortInitialRelicIds(wave.initialRelicIds, sharedInitialRelicIds).map(
      (relicId) => {
        const reference = referencesByRelicId.get(relicId)
        if (!reference) {
          throw new Error(`D-Zone wave "${wave.id}" is missing relic reference "${relicId}".`)
        }
        return buildRelicPreview(reference)
      },
    )

    return {
      wave: resolveDzoneWaveViewModel(wave),
      relics,
    }
  })
}
