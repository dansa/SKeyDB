import {useState, type ReactNode} from 'react'

import {FaChevronDown} from 'react-icons/fa6'

import {
  hasAwakenerSubstatScaling,
  resolveAwakenerStatsForLevel,
} from '@/domain/awakener-level-scaling'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import {buildScalingInfoEntry, type ScalingInfoRecord} from '@/domain/database-scaling-info'
import {
  getColoredMainstatIcon,
  getMainstatAccentColor,
  getMainstatIcon,
  type MainstatKey,
} from '@/domain/mainstats'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {usePopoverStore} from './usePopoverStore'

const MAIN_STAT_ORDER = ['CON', 'ATK', 'DEF'] as const
const SECONDARY_STAT_ORDER = [
  'CritRate',
  'CritDamage',
  'RealmMastery',
  'AliemusRegen',
  'KeyflareRegen',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
] as const

type SidebarStatKey = (typeof MAIN_STAT_ORDER)[number] | (typeof SECONDARY_STAT_ORDER)[number]

const STAT_LABELS: Record<SidebarStatKey, string> = {
  CON: 'CON',
  ATK: 'ATK',
  DEF: 'DEF',
  CritRate: 'Crit Rate',
  CritDamage: 'Crit DMG',
  AliemusRegen: 'Aliemus Regen',
  KeyflareRegen: 'Keyflare Regen',
  RealmMastery: 'Realm Mastery',
  SigilYield: 'Sigil Yield',
  DamageAmplification: 'DMG Amp',
  DeathResistance: 'Death Resist',
}

const STAT_TO_MAINSTAT_KEY: Record<SidebarStatKey, MainstatKey> = {
  CON: 'CON',
  ATK: 'ATK',
  DEF: 'DEF',
  CritRate: 'CRIT_RATE',
  CritDamage: 'CRIT_DMG',
  RealmMastery: 'REALM_MASTERY',
  AliemusRegen: 'ALIEMUS_REGEN',
  KeyflareRegen: 'KEYFLARE_REGEN',
  SigilYield: 'SIGIL_YIELD',
  DamageAmplification: 'DMG_AMP',
  DeathResistance: 'DEATH_RESISTANCE',
}

const PSYCHE_SURGE_OFFSETS = Array.from({length: 13}, (_, index) => index)
const SIDEBAR_SCALING_VALUE_BASE_CLASS =
  'db-dash-underline db-dash-underline-hover cursor-help font-bold text-slate-200 [--db-dash-strength:34%] [--db-dash-hover-strength:44%] hover:text-slate-100'

interface AwakenerDetailStatsPanelProps {
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
  action?: ReactNode
  compact?: boolean
  defaultExpanded?: boolean
  gnosticPotentialLevel?: number
  isExpanded?: boolean
  onExpandedChange?: (isExpanded: boolean) => void
  enlightenOffset?: number
  level?: number
}

function parseScalingPreviewValue(rawValue: string): {value: number; suffix: string} | null {
  const match = /^(-?\d+(?:\.\d+)?)(%)?$/.exec(rawValue.trim())
  if (!match) {
    return null
  }
  const [, value, suffix = ''] = match
  return {value: Number(value), suffix}
}

interface StatRowProps {
  statKey: SidebarStatKey
  stats: FullStats
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
  compact?: boolean
  enlightenOffset?: number
  level?: number
}

function StatRow({
  statKey,
  stats,
  substatScaling,
  scalingRecord,
  compact,
  enlightenOffset = 0,
  level = 60,
}: StatRowProps) {
  const openRootInfo = usePopoverStore((state) => state.openRootInfo)

  const value = stats[statKey]
  const scaledSubstat = substatScaling?.[statKey as keyof SubstatScaling]
  const mainstatKey = STAT_TO_MAINSTAT_KEY[statKey]
  const icon = getMainstatIcon(mainstatKey)
  const coloredIcon = getColoredMainstatIcon(mainstatKey)
  const accentColor = getMainstatAccentColor(mainstatKey)
  const statTitle = scaledSubstat
    ? `Level scaling: +${scaledSubstat} per 10 levels to Lv. 60`
    : undefined

  const isPrimaryStat = (MAIN_STAT_ORDER as readonly string[]).includes(statKey)
  const isHighlightedSubstat = Boolean(scaledSubstat)

  const labelClass = isHighlightedSubstat
    ? 'font-bold text-slate-400'
    : isPrimaryStat
      ? 'font-bold text-slate-400'
      : 'font-bold text-slate-500/60'

  const valueClass = isHighlightedSubstat
    ? `${SIDEBAR_SCALING_VALUE_BASE_CLASS} [--db-dash-bottom:-0.05em]`
    : isPrimaryStat
      ? 'font-bold text-slate-200'
      : 'text-slate-500/60'

  const rowContent = (
    <>
      <div className='flex min-w-0 items-center gap-1.5'>
        <span
          className='ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center'
          style={{
            filter: isHighlightedSubstat || isPrimaryStat ? undefined : 'grayscale(1) opacity(0.3)',
            transform: 'translateY(-1px)',
          }}
        >
          {isPrimaryStat ? (
            <div
              className='h-full w-full'
              style={{
                backgroundColor: accentColor,
                WebkitMaskImage: `url(${icon ?? ''})`,
                maskImage: `url(${icon ?? ''})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            />
          ) : (
            <img alt='' className='h-full w-full object-contain' src={coloredIcon ?? icon} />
          )}
        </span>
        <span className={`${labelClass} truncate text-[11px] whitespace-nowrap`}>
          {STAT_LABELS[statKey]}
        </span>
      </div>
      <span className={`${valueClass} text-right text-[11px] whitespace-nowrap`} title={statTitle}>
        {value}
      </span>
    </>
  )

  return (
    <div
      className={`relative ${compact ? '' : 'flex min-h-0 flex-1 items-center justify-between'}`}
    >
      {isHighlightedSubstat ? (
        <button
          className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center overflow-visible rounded-[3px] text-left leading-normal transition-colors hover:bg-white/3 ${
            compact
              ? 'gap-x-1.5 px-0.5 py-1 text-[12px]'
              : 'h-full min-h-0 gap-x-3 px-2 py-0.5 text-[12px]'
          }`}
          onClick={(event) => {
            const targetValues = PSYCHE_SURGE_OFFSETS.map((offset) => {
              const rawValue = resolveAwakenerStatsForLevel(scalingRecord, level, offset)[
                statKey as keyof SubstatScaling
              ]
              return parseScalingPreviewValue(rawValue)
            })
            if (targetValues.some((entry) => entry === null)) return

            const typedValues = targetValues as {value: number; suffix: string}[]
            const popoverKey = `scaling-preview-${statKey}`
            const popoverEntry: KeyedDatabaseReferenceEntry = {
              key: popoverKey,
              name: STAT_LABELS[statKey],
              label: 'Attribute Scaling',
              description: '',
              scalingValues: typedValues.map((e) => e.value),
              scalingSuffix: typedValues[0]?.suffix ?? '',
              scalingStat: STAT_LABELS[statKey],
              scalingCurrentLevel: enlightenOffset,
              scalingLevelStart: 0,
              scalingLevelLabelPrefix: 'E3 +',
            }

            openRootInfo(popoverEntry, event)
          }}
          type='button'
        >
          {rowContent}
        </button>
      ) : (
        <div
          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center overflow-visible leading-normal ${
            compact
              ? 'gap-x-1.5 px-0.5 py-1 text-[12px]'
              : 'min-h-0 flex-1 gap-x-3 px-2 py-0.5 text-[12px]'
          }`}
        >
          {rowContent}
        </div>
      )}
    </div>
  )
}

export function AwakenerDetailStatsPanel({
  action,
  compact,
  defaultExpanded = false,
  gnosticPotentialLevel,
  isExpanded: controlledIsExpanded,
  scalingRecord,
  stats,
  substatScaling,
  enlightenOffset = 0,
  level = 60,
}: AwakenerDetailStatsPanelProps) {
  const [localIsExpanded] = useState(defaultExpanded)
  const isExpanded = controlledIsExpanded ?? localIsExpanded
  const hasSubstatScaling = hasAwakenerSubstatScaling(substatScaling)
  const openRootInfo = usePopoverStore((state) => state.openRootInfo)

  const primaryStatKeys = MAIN_STAT_ORDER
  const scalingStatKeys = SECONDARY_STAT_ORDER.filter((key) => Boolean(substatScaling?.[key]))

  if (compact) {
    return (
      <div className='border border-white/4 bg-white/2 px-3 py-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <h4 className='ui-title text-[11px] leading-normal tracking-wide text-slate-400 uppercase'>
            Stats
          </h4>
          {action}
        </div>

        {stats ? (
          <>
            <div className='grid grid-cols-3 gap-y-0.5' data-awakener-main-stats=''>
              {primaryStatKeys.map((key, index) => (
                <div className={`px-2 ${index < 2 ? 'border-r border-white/5' : ''}`} key={key}>
                  <StatRow
                    compact={compact}
                    enlightenOffset={enlightenOffset}
                    level={level}
                    scalingRecord={scalingRecord}
                    statKey={key}
                    stats={stats}
                    substatScaling={substatScaling}
                  />
                </div>
              ))}
            </div>

            <div className='my-2 border-t border-white/5' />

            {scalingStatKeys.length > 0 && (
              <div className='grid grid-cols-2 gap-y-0.5' data-awakener-secondary-stats=''>
                {scalingStatKeys.map((key, index) => (
                  <div className={`px-2 ${index < 1 ? 'border-r border-white/5' : ''}`} key={key}>
                    <StatRow
                      compact={compact}
                      enlightenOffset={enlightenOffset}
                      level={level}
                      scalingRecord={scalingRecord}
                      statKey={key}
                      stats={stats}
                      substatScaling={substatScaling}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className='text-[11px] leading-normal text-slate-500'>Loading…</p>
        )}

        {stats && (
          <div className='mt-2.5 flex justify-center'>
            <button
              aria-expanded={isExpanded}
              className='inline-flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-slate-500 uppercase transition-colors hover:text-amber-100'
              onClick={(event) => {
                const attributeRows = SECONDARY_STAT_ORDER.map((key) => {
                  const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
                  const icon = getMainstatIcon(mainstatKey)
                  const coloredIcon = getColoredMainstatIcon(mainstatKey)
                  return {
                    iconSrc: coloredIcon ?? icon ?? undefined,
                    label: STAT_LABELS[key],
                    value: stats[key],
                  }
                })

                const scalingInfo = buildScalingInfoEntry(scalingRecord, {gnosticPotentialLevel})
                const popoverEntry: KeyedDatabaseReferenceEntry = {
                  key: 'database:secondary-stats',
                  name: 'Secondary Stats',
                  label: 'Attributes',
                  description: '',
                  attributeRows: attributeRows,
                  detailLinks: hasSubstatScaling
                    ? [
                        {
                          label: 'Scaling Info',
                          entry: scalingInfo,
                        },
                      ]
                    : [],
                }
                openRootInfo(popoverEntry, event)
              }}
              type='button'
            >
              <FaChevronDown className='size-2.5' />
              <span>Show all stats</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // PC version: normal list of stats (main stats + scaling secondary stats)
  const defaultStatKeys = [
    ...MAIN_STAT_ORDER,
    ...SECONDARY_STAT_ORDER.filter((key) => Boolean(substatScaling?.[key])),
  ]

  return (
    <div className='border border-white/4 bg-white/2 px-3.5 py-3 shadow-sm'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <h4 className='ui-title text-[11px] leading-normal tracking-wide text-slate-400 uppercase'>
          Stats
        </h4>
        {action}
      </div>

      {stats ? (
        <div className='space-y-px' data-awakener-main-stats=''>
          {defaultStatKeys.map((key) => (
            <StatRow
              key={key}
              compact={compact}
              enlightenOffset={enlightenOffset}
              level={level}
              scalingRecord={scalingRecord}
              statKey={key}
              stats={stats}
              substatScaling={substatScaling}
            />
          ))}
        </div>
      ) : (
        <p className='text-[11px] leading-normal text-slate-500'>Loading…</p>
      )}

      {stats && (
        <div className='mt-2.5 flex justify-center'>
          <button
            aria-expanded={isExpanded}
            className='inline-flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-slate-500 uppercase transition-colors hover:text-amber-100'
            onClick={(event) => {
              const attributeRows = SECONDARY_STAT_ORDER.map((key) => {
                const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
                const icon = getMainstatIcon(mainstatKey)
                const coloredIcon = getColoredMainstatIcon(mainstatKey)
                return {
                  iconSrc: coloredIcon ?? icon ?? undefined,
                  label: STAT_LABELS[key],
                  value: stats[key],
                }
              })

              const scalingInfo = buildScalingInfoEntry(scalingRecord, {gnosticPotentialLevel})
              const popoverEntry: KeyedDatabaseReferenceEntry = {
                key: 'database:secondary-stats',
                name: 'Secondary Stats',
                label: 'Attributes',
                description: '',
                attributeRows: attributeRows,
                detailLinks: hasSubstatScaling
                  ? [
                      {
                        label: 'Scaling Info',
                        entry: scalingInfo,
                      },
                    ]
                  : [],
              }
              openRootInfo(popoverEntry, event)
            }}
            type='button'
          >
            <FaChevronDown className='size-2.5' />
            <span>Show all stats</span>
          </button>
        </div>
      )}
    </div>
  )
}
