export const PICKER_DROP_ZONE_ID = 'dropzone:picker'

const WHEEL_DROP_ZONE_PREFIX = 'dropzone:wheel:'

export function makeWheelDropZoneId(slotId: string, wheelIndex: number): string {
  return `${WHEEL_DROP_ZONE_PREFIX}${slotId}:${wheelIndex}`
}

export function parseWheelDropZoneId(id: string): { slotId: string; wheelIndex: number } | null {
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

  return { slotId, wheelIndex }
}
