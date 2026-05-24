import {resolveAwakenerStatsForLevel} from './awakener-level-scaling'
import type {AwakenerTalentRecord} from './awakener-source-schema'
import type {AwakenerFullRecord} from './awakeners-full'
import {resolveDescriptionArg} from './description-args'

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
> &
  Partial<Pick<AwakenerFullRecord, 'talents'>>
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
interface ScalingInfoOptions {
  gnosticPotentialLevel?: number
}
interface PrimaryStatBonusContext {
  label: string | null
  level: number
}

function getPrimaryStatGrowth(
  awakener: Pick<ScalingInfoRecord, 'statScaling'>,
  statKey: PrimaryStatKey,
): string {
  return `+${fmtScalingValue(awakener.statScaling[statKey])}/Lv`
}

function buildPrimaryStatLine(
  awakener: ScalingInfoRecord,
  statKey: PrimaryStatKey,
  bonusContext: PrimaryStatBonusContext,
): string {
  const milestones = PRIMARY_LEVEL_SUMMARY_LEVELS.map((level) => {
    const stats = resolveAwakenerStatsForLevel(awakener, level, 0, 0, {
      [statKey]: bonusContext.level,
    })
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

export function buildScalingInfoEntry(
  awakener: ScalingInfoRecord,
  options: ScalingInfoOptions = {},
): ScalingInfoReferenceEntry {
  const bonusContext = getPrimaryStatBonusContext(awakener, options)
  const substatLines = buildSubstatLines(awakener)
  const primaryStatLines = PRIMARY_STAT_KEYS.map((statKey) =>
    buildPrimaryStatLine(awakener, statKey, bonusContext),
  )
  const primaryFormula = `Primary formula: Lv + ${awakener.primaryScalingBase}${
    bonusContext.label ? ` + ${bonusContext.label}` : ''
  }, then × growth`
  const detailDescription = [
    'Primary',
    primaryFormula,
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
      `Primary stats: every level to Lv. 90${bonusContext.label ? `, including ${bonusContext.label} stat levels` : ''}.\nSecondary stats: every 10 levels to Lv. 60.\nPsyche Surge adds extra secondary-stat steps after E3.`,
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

function getPrimaryStatBonusContext(
  awakener: ScalingInfoRecord,
  options: ScalingInfoOptions,
): PrimaryStatBonusContext {
  const gnosticTalent = getGnosticPotentialTalents(awakener.talents).find(
    (talent) => talent.defaultMaxed === true || options.gnosticPotentialLevel !== undefined,
  )
  if (!gnosticTalent?.maxLevel || !Object.hasOwn(gnosticTalent.descriptionArgs, 'Arg1')) {
    return {label: null, level: 0}
  }

  const rank =
    options.gnosticPotentialLevel !== undefined
      ? Math.max(0, Math.min(options.gnosticPotentialLevel, gnosticTalent.maxLevel))
      : gnosticTalent.defaultMaxed
        ? gnosticTalent.maxLevel
        : 0
  if (rank <= 0) {
    return {label: null, level: 0}
  }

  const level =
    resolveDescriptionArg(gnosticTalent.descriptionArgs.Arg1, {
      rank,
    }).totalValue ?? 0
  const label = gnosticTalent.defaultMaxed
    ? `default Gnostic +${level}`
    : `Gnostic +${level}`
  return {label, level}
}

function getGnosticPotentialTalents(
  talents: ScalingInfoRecord['talents'],
): AwakenerTalentRecord[] {
  if (!talents) {
    return []
  }
  return [talents.T1, talents.T2, talents.T3, talents.T4, ...talents.extraTalents].filter(
    (talent): talent is AwakenerTalentRecord => talent?.family === 'gnostic_potential',
  )
}

function fmtScalingValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}
