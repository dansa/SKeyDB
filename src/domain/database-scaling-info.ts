import {resolveAwakenerStatsForLevel} from './awakener-level-scaling'
import type {AwakenerFullRecord} from './awakeners-full'
import {fmtNum} from './scaling'

const PRIMARY_STAT_KEYS = ['CON', 'ATK', 'DEF'] as const
const PRIMARY_LEVEL_SUMMARY_LEVELS = [1, 60, 90] as const
const SUBSTAT_LABELS: Record<string, string> = {
  CritRate: 'Crit Rate',
  CritDamage: 'Crit DMG',
  RealmMastery: 'Realm Mastery',
  AliemusRegen: 'Aliemus Regen',
  KeyflareRegen: 'Keyflare Regen',
  SigilYield: 'Sigil Yield',
  DamageAmplification: 'DMG Amp',
  DeathResistance: 'Death Resist',
}

export type ScalingInfoRecord = Pick<
  AwakenerFullRecord,
  'stats' | 'primaryScalingBase' | 'statScaling' | 'substatScaling'
>
interface ScalingInfoReferenceEntry {
  key: string
  name: string
  label: string
  description: string
  detailLinks?: {
    label: string
    entry: ScalingInfoReferenceEntry
  }[]
}
type PrimaryStatKey = (typeof PRIMARY_STAT_KEYS)[number]

function getPrimaryStatGrowth(
  awakener: Pick<ScalingInfoRecord, 'statScaling'>,
  statKey: PrimaryStatKey,
): string {
  return `+${fmtNum(awakener.statScaling[statKey])}/Lv`
}

function buildPrimaryStatLine(awakener: ScalingInfoRecord, statKey: PrimaryStatKey): string {
  const milestones = PRIMARY_LEVEL_SUMMARY_LEVELS.map((level) => {
    const stats = resolveAwakenerStatsForLevel(awakener, level)
    return `Lv.${String(level)} ${stats[statKey]}`
  })
  return `${statKey}: ${getPrimaryStatGrowth(awakener, statKey)} · ${milestones.join(' · ')}`
}

function buildSubstatLines(awakener: ScalingInfoRecord): string[] {
  const levelSixtyStats = resolveAwakenerStatsForLevel(awakener, 60)

  return Object.entries(awakener.substatScaling)
    .filter(([, growth]) => Boolean(growth))
    .map(([key, growth]) => {
      const label = SUBSTAT_LABELS[key] ?? key
      const statKey = key as keyof typeof awakener.stats
      return `${label}: +${growth}/10 Lv · Lv.60 ${levelSixtyStats[statKey]}`
    })
}

export function buildScalingInfoEntry(awakener: ScalingInfoRecord): ScalingInfoReferenceEntry {
  const substatLines = buildSubstatLines(awakener)
  const primaryStatLines = PRIMARY_STAT_KEYS.map((statKey) =>
    buildPrimaryStatLine(awakener, statKey),
  )
  const detailDescription = [
    'Primary',
    ...primaryStatLines,
    '',
    'Secondary',
    ...substatLines,
    '',
    'Psyche Surge adds extra secondary-stat steps after E3, using the same gain shown above.',
  ].join('\n')

  return {
    key: 'database:scaling-info',
    name: 'Scaling Information',
    label: 'Database Guide',
    description:
      'Primary stats: every level to Lv. 90.\nSecondary stats: every 10 levels to Lv. 60.\nPsyche Surge adds extra secondary-stat steps after E3.',
    detailLinks: [
      {
        label: 'Show exact breakpoints',
        entry: {
          key: 'database:scaling-info:breakdown',
          name: 'Scaling Breakdown',
          label: 'Level & Psyche Surge Values',
          description: detailDescription,
        },
      },
    ],
  }
}
