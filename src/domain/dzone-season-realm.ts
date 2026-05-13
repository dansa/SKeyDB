import {
  getDzoneSeasonSharedInitialRelicIds,
  type DzoneRealm,
  type DzoneSeason,
  type DzoneSeasonSummary,
} from './dzone'
import {getRelicById} from './relics'

const DZONE_REALM_DISPLAY_NAMES: Record<DzoneRealm, string> = {
  AEQUOR: 'Aequor Ring',
  CARO: 'Caro Ring',
  CHAOS: 'Chaos Ring',
  ULTRA: 'Ultra Ring',
}

export function stripDzoneRealmQuotes(text: string): string {
  return text.replace(/^"(.+)"$/, '$1')
}

export function getDzoneRealmDisplayName(realm: DzoneRealm): string {
  return DZONE_REALM_DISPLAY_NAMES[realm]
}

export function getDzoneSeasonSummaryDisplayName(summary: DzoneSeasonSummary): string {
  return summary.realm ? getDzoneRealmDisplayName(summary.realm) : summary.name
}

export function getDzoneSeasonRealmName(season: DzoneSeason): string {
  const sharedRelicIds = getDzoneSeasonSharedInitialRelicIds(season)
  if (sharedRelicIds.length === 0) {
    return season.name
  }

  if (sharedRelicIds.length > 1) {
    throw new Error(
      `D-zone season "${season.id}" must have no more than one shared initial relic, found ${String(
        sharedRelicIds.length,
      )}.`,
    )
  }

  const sharedRelicId = sharedRelicIds[0]
  const sharedRelic = sharedRelicId ? getRelicById(sharedRelicId) : null
  return sharedRelic ? stripDzoneRealmQuotes(sharedRelic.name) : season.name
}
