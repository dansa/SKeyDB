function trimEdgeDashes(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') {
    start += 1
  }
  while (end > start && value[end - 1] === '-') {
    end -= 1
  }
  return value.slice(start, end)
}

export function normalizeAwakenerRecordKey(value: string): string {
  return trimEdgeDashes(
    value
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[:\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-'),
  )
}

export function buildAwakenerSkillRecordId(ownerKey: string, displayName: string): string {
  return `skill.${ownerKey}.${normalizeAwakenerRecordKey(displayName)}`
}

export function buildAwakenerTalentRecordId(ownerKey: string, displayName: string): string {
  return `talent.${ownerKey}.${normalizeAwakenerRecordKey(displayName)}`
}

export function buildAwakenerEnlightenRecordId(ownerKey: string, displayName: string): string {
  return `enlighten.${ownerKey}.${normalizeAwakenerRecordKey(displayName)}`
}
