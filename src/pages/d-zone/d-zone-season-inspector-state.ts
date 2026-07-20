import type {DzoneAlertOption} from '@/domain/dzone'

export interface WaveDisclosureState {
  openWaveIds: Set<string>
  seasonId: string
}

export interface AlertSelectionState {
  alertId: string | null
}

function getAlertLevel(alertId: string): number | null {
  const level = Number(/^alert-(\d+)$/.exec(alertId)?.[1] ?? Number.NaN)
  return Number.isFinite(level) ? level : null
}

function getHighestAvailableAlertIdAtOrBelow(
  alertOptions: DzoneAlertOption[],
  alertId: string,
): string | null {
  const selectedLevel = getAlertLevel(alertId)
  if (selectedLevel === null) {
    return null
  }

  const rankedOptions: {alert: DzoneAlertOption; level: number}[] = []
  for (const alert of alertOptions) {
    const level = getAlertLevel(alert.id)
    if (level !== null && level <= selectedLevel) {
      rankedOptions.push({alert, level})
    }
  }
  rankedOptions.sort((left, right) => right.level - left.level)

  return rankedOptions[0]?.alert.id ?? null
}

export function buildDefaultOpenWaveIds(defaultOpenWaveId: string | undefined): Set<string> {
  return new Set(defaultOpenWaveId ? [defaultOpenWaveId] : [])
}

export function getResolvedOpenWaveIds({
  defaultOpenWaveId,
  seasonId,
  waveDisclosureState,
}: {
  defaultOpenWaveId: string | undefined
  seasonId: string
  waveDisclosureState: WaveDisclosureState
}): Set<string> {
  return waveDisclosureState.seasonId === seasonId
    ? waveDisclosureState.openWaveIds
    : buildDefaultOpenWaveIds(defaultOpenWaveId)
}

export function toggleResolvedOpenWaveId({
  defaultOpenWaveId,
  seasonId,
  waveDisclosureState,
  waveId,
}: {
  defaultOpenWaveId: string | undefined
  seasonId: string
  waveDisclosureState: WaveDisclosureState
  waveId: string
}): WaveDisclosureState {
  const nextOpenWaveIds = new Set(
    getResolvedOpenWaveIds({defaultOpenWaveId, seasonId, waveDisclosureState}),
  )
  if (nextOpenWaveIds.has(waveId)) {
    nextOpenWaveIds.delete(waveId)
  } else {
    nextOpenWaveIds.add(waveId)
  }
  return {openWaveIds: nextOpenWaveIds, seasonId}
}

export function getSelectedAlertId({
  alertOptions,
  alertSelectionState,
}: {
  alertOptions: DzoneAlertOption[]
  alertSelectionState: AlertSelectionState
}): string | null {
  if (alertOptions.length === 0) {
    return null
  }
  if (alertSelectionState.alertId) {
    if (alertOptions.some((alert) => alert.id === alertSelectionState.alertId)) {
      return alertSelectionState.alertId
    }

    const nearestAvailableAlertId = getHighestAvailableAlertIdAtOrBelow(
      alertOptions,
      alertSelectionState.alertId,
    )
    if (nearestAvailableAlertId) {
      return nearestAvailableAlertId
    }
  }
  return alertOptions[0]?.id ?? null
}
