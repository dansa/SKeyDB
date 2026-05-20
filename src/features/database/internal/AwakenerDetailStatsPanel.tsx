import {useState, type ReactNode} from 'react'

import {FaChevronDown, FaCircleInfo} from 'react-icons/fa6'

import {hasAwakenerSubstatScaling} from '@/domain/awakener-level-scaling'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import {buildScalingInfoEntry, type ScalingInfoRecord} from '@/domain/database-scaling-info'
import {getMainstatIcon, type MainstatKey} from '@/domain/mainstats'

import {useDatabasePopoverControllerContext} from './database-popover-context'

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

const SIDEBAR_STAT_VALUE_CLASS = 'text-slate-200'
const SIDEBAR_SCALING_VALUE_CLASS =
  'cursor-help border-b border-dotted border-slate-500/45 text-slate-200 transition-colors hover:border-slate-300/65 hover:text-slate-100'

interface AwakenerDetailStatsPanelProps {
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
  action?: ReactNode
  compact?: boolean
  defaultExpanded?: boolean
  isExpanded?: boolean
  onExpandedChange?: (isExpanded: boolean) => void
}

function ScalingInfoButton({
  className = '',
  scalingRecord,
}: {
  className?: string
  scalingRecord: ScalingInfoRecord
}) {
  const popoverContext = useDatabasePopoverControllerContext()

  return (
    <button
      className={`inline-flex items-center gap-1 text-[10px] leading-none text-slate-400 transition-colors hover:text-amber-100 ${className}`}
      onClick={(event) => {
        popoverContext?.openRootInfo?.(buildScalingInfoEntry(scalingRecord), event)
      }}
      type='button'
    >
      <FaCircleInfo className='h-2.5 w-2.5 text-amber-200/75' />
      <span className='border-b border-dotted border-slate-500/45 tracking-[0.18em] uppercase'>
        Scaling info
      </span>
    </button>
  )
}

export function AwakenerDetailStatsPanel({
  action,
  compact,
  defaultExpanded = false,
  isExpanded: controlledIsExpanded,
  onExpandedChange,
  scalingRecord,
  stats,
  substatScaling,
}: AwakenerDetailStatsPanelProps) {
  const [localIsExpanded, setLocalIsExpanded] = useState(defaultExpanded)
  const isExpanded = controlledIsExpanded ?? localIsExpanded
  const hasSubstatScaling = hasAwakenerSubstatScaling(substatScaling)
  const defaultStatKeys = [
    ...MAIN_STAT_ORDER,
    ...SECONDARY_STAT_ORDER.filter((key) => Boolean(substatScaling?.[key])),
  ]
  const expandedStatKeys = SECONDARY_STAT_ORDER.filter((key) => !defaultStatKeys.includes(key))

  function setExpanded(nextIsExpanded: boolean) {
    if (controlledIsExpanded === undefined) {
      setLocalIsExpanded(nextIsExpanded)
    }
    onExpandedChange?.(nextIsExpanded)
  }

  function renderStatRow(key: SidebarStatKey) {
    if (!stats) {
      return null
    }

    const value = stats[key]
    const scaledSubstat = substatScaling?.[key as keyof SubstatScaling]
    const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
    const icon = getMainstatIcon(mainstatKey)
    const statTitle = scaledSubstat
      ? `Level scaling: +${scaledSubstat} per 10 levels to Lv. 60`
      : undefined

    return (
      <div className='flex min-w-0 items-center justify-between gap-2 text-[11px]' key={key}>
        <span className='flex min-w-0 items-center gap-1.5 text-slate-500'>
          {icon ? (
            <img
              alt=''
              className='h-3.5 w-3.5 shrink-0 object-contain opacity-60'
              draggable={false}
              src={icon}
            />
          ) : null}
          <span className='truncate'>{STAT_LABELS[key]}</span>
        </span>
        <span
          className={scaledSubstat ? SIDEBAR_SCALING_VALUE_CLASS : SIDEBAR_STAT_VALUE_CLASS}
          title={statTitle}
        >
          {value}
        </span>
      </div>
    )
  }

  return (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2.5'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <h4 className='ui-title text-[11px] tracking-wide text-slate-400 uppercase'>Stats</h4>
        {action}
      </div>

      {stats ? (
        <>
          <div
            className={compact ? 'grid grid-cols-3 gap-x-3 gap-y-0.5' : 'space-y-px'}
            data-awakener-main-stats=''
          >
            {defaultStatKeys.map(renderStatRow)}
          </div>

          {isExpanded ? (
            <div
              className={
                compact
                  ? 'mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 border-t border-slate-700/35 pt-1.5'
                  : 'mt-px space-y-px'
              }
              data-awakener-secondary-stats=''
            >
              {expandedStatKeys.map(renderStatRow)}
            </div>
          ) : null}
        </>
      ) : (
        <p className='text-[11px] text-slate-500'>Loading...</p>
      )}

      {compact ? (
        <div className='mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'>
          <button
            aria-expanded={isExpanded}
            className='inline-flex min-w-0 items-center gap-1.5 text-left text-[10px] tracking-[0.16em] text-slate-500 uppercase transition-colors hover:text-amber-100'
            onClick={() => {
              setExpanded(!isExpanded)
            }}
            type='button'
          >
            <FaChevronDown
              className={`h-2.5 w-2.5 shrink-0 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
            <span className='truncate'>{isExpanded ? 'Hide secondary' : 'Show all stats'}</span>
          </button>

          {isExpanded && hasSubstatScaling ? (
            <ScalingInfoButton className='justify-self-end' scalingRecord={scalingRecord} />
          ) : null}
        </div>
      ) : (
        <>
          <button
            aria-expanded={isExpanded}
            className='mt-2 inline-flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-slate-500 uppercase transition-colors hover:text-amber-100'
            onClick={() => {
              setExpanded(!isExpanded)
            }}
            type='button'
          >
            <FaChevronDown
              className={`h-2.5 w-2.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            {isExpanded ? 'Hide secondary stats' : 'Show all stats'}
          </button>

          {isExpanded && hasSubstatScaling ? (
            <ScalingInfoButton className='mt-2' scalingRecord={scalingRecord} />
          ) : null}
        </>
      )}
    </div>
  )
}
