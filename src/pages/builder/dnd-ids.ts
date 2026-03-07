export const PICKER_DROP_ZONE_ID = 'dropzone:picker'

const WHEEL_DROP_ZONE_PREFIX = 'dropzone:wheel:'
const COVENANT_DROP_ZONE_PREFIX = 'dropzone:covenant:'
const TEAM_PREVIEW_SLOT_DROP_ZONE_PREFIX = 'dropzone:team-preview-slot:'

export function makeWheelDropZoneId(slotId: string, wheelIndex: number): string {
  return `${WHEEL_DROP_ZONE_PREFIX}${slotId}:${String(wheelIndex)}`
}

export function parseWheelDropZoneId(id: string): {slotId: string; wheelIndex: number} | null {
  if (!id.startsWith(WHEEL_DROP_ZONE_PREFIX)) {
    return null
  }

  const payload = id.slice(WHEEL_DROP_ZONE_PREFIX.length)
  const separatorIndex = payload.lastIndexOf(':')
  if (separatorIndex < 0) {
    return null
  }

  const slotId = payload.slice(0, separatorIndex)
  const wheelIndexRaw = payload.slice(separatorIndex + 1)
  const wheelIndex = Number.parseInt(wheelIndexRaw, 10)
  if (!slotId || Number.isNaN(wheelIndex) || wheelIndex < 0 || wheelIndex > 1) {
    return null
  }

  return {slotId, wheelIndex}
}

export function makeCovenantDropZoneId(slotId: string): string {
  return `${COVENANT_DROP_ZONE_PREFIX}${slotId}`
}

export function parseCovenantDropZoneId(id: string): {slotId: string} | null {
  if (!id.startsWith(COVENANT_DROP_ZONE_PREFIX)) {
    return null
  }

  const slotId = id.slice(COVENANT_DROP_ZONE_PREFIX.length)
  if (!slotId) {
    return null
  }

  return {slotId}
}

export function makeTeamPreviewSlotDropZoneId(teamId: string, slotId: string): string {
  return `${TEAM_PREVIEW_SLOT_DROP_ZONE_PREFIX}${teamId}:${slotId}`
}

export function parseTeamPreviewSlotDropZoneId(
  id: string,
): {teamId: string; slotId: string} | null {
  if (!id.startsWith(TEAM_PREVIEW_SLOT_DROP_ZONE_PREFIX)) {
    return null
  }

  const payload = id.slice(TEAM_PREVIEW_SLOT_DROP_ZONE_PREFIX.length)
  const separatorIndex = payload.indexOf(':')
  if (separatorIndex < 0) {
    return null
  }

  const teamId = payload.slice(0, separatorIndex)
  const slotId = payload.slice(separatorIndex + 1)
  if (!teamId || !slotId) {
    return null
  }

  return {teamId, slotId}
}
