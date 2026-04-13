export interface AwakenerDetailSettings {
  awakenerLevel?: number
  psycheSurgeOffset?: number
  skillLevel?: number
}

const SETTINGS_KEY_PREFIX = 'awk-detail-settings-'

export function readAwakenerDetailSettings(awakenerId: number): AwakenerDetailSettings {
  const stored = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${String(awakenerId)}`)
  if (!stored) return {}
  try {
    return JSON.parse(stored) as AwakenerDetailSettings
  } catch {
    return {}
  }
}

export function writeAwakenerDetailSettings(
  awakenerId: number,
  settings: AwakenerDetailSettings,
): void {
  const current = readAwakenerDetailSettings(awakenerId)
  const next = {...current, ...settings}
  localStorage.setItem(`${SETTINGS_KEY_PREFIX}${String(awakenerId)}`, JSON.stringify(next))
}
