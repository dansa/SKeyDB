import type {MouseEvent} from 'react'

import {FaCircleInfo} from 'react-icons/fa6'

import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import {hasAwakenerSubstatScaling} from '@/domain/awakener-level-scaling'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'
import {buildScalingInfoEntry, type ScalingInfoRecord} from '@/domain/database-scaling-info'
import {getMainstatIcon, type MainstatKey} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {AwakenerDetailStateControls} from './AwakenerDetailStateControls'
import {AwakenerPsycheSurgeStepper} from './AwakenerPsycheSurgeStepper'
import {useDatabasePopoverControllerContext} from './database-popover-context'

const STAT_DISPLAY_ORDER = [
  'CON',
  'ATK',
  'DEF',
  'CritRate',
  'CritDamage',
  'RealmMastery',
  'AliemusRegen',
  'KeyflareRegen',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
] as const
type SidebarStatKey = (typeof STAT_DISPLAY_ORDER)[number]

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

interface AwakenerDetailSidebarProps {
  awakener: Awakener
  controls: AwakenerDatabaseControls
  selection: AwakenerDatabaseSelection
  onPatchSelection: (nextPartial: Partial<AwakenerDatabaseSelection>) => void
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
  compact?: boolean
}

function ScalingInfoButton({scalingRecord}: {scalingRecord: ScalingInfoRecord}) {
  const popoverContext = useDatabasePopoverControllerContext()

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    popoverContext?.openRootInfo?.(buildScalingInfoEntry(scalingRecord), event)
  }

  return (
    <button
      className='mt-2 inline-flex items-center gap-1 text-[10px] leading-none text-slate-400 transition-colors hover:text-amber-100'
      onClick={handleClick}
      type='button'
    >
      <FaCircleInfo className='h-2.5 w-2.5 text-amber-200/75' />
      <span className='border-b border-dotted border-slate-500/45 tracking-[0.18em] uppercase'>
        Scaling info
      </span>
    </button>
  )
}

export function AwakenerDetailSidebar({
  awakener,
  controls,
  selection,
  onPatchSelection,
  stats,
  substatScaling,
  scalingRecord,
  compact,
}: AwakenerDetailSidebarProps) {
  const displayName = formatAwakenerNameForUi(awakener.name)
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const hasSubstatScaling = hasAwakenerSubstatScaling(substatScaling)
  const progressionSection = (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2.5'>
      <h4 className='ui-title mb-2 text-[11px] tracking-wide text-slate-400 uppercase'>
        Progression
      </h4>
      <AwakenerDetailStateControls
        compact={compact}
        controls={controls}
        onPatchSelection={onPatchSelection}
        selection={selection}
      />
    </div>
  )

  const attributesSection = (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2.5'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <h4 className='ui-title text-[11px] tracking-wide text-slate-400 uppercase'>Attributes</h4>
        {controls.canAdjustPsycheSurge ? (
          <AwakenerPsycheSurgeStepper
            offset={selection.psycheSurgeOffset}
            onDecrease={() => {
              onPatchSelection({psycheSurgeOffset: selection.psycheSurgeOffset - 1})
            }}
            onIncrease={() => {
              onPatchSelection({psycheSurgeOffset: selection.psycheSurgeOffset + 1})
            }}
          />
        ) : null}
      </div>

      {stats ? (
        <div className={compact ? 'grid grid-cols-2 gap-x-4 gap-y-0.5' : 'space-y-px'}>
          {STAT_DISPLAY_ORDER.map((key) => {
            const value = stats[key]
            const scaledSubstat = substatScaling?.[key as keyof SubstatScaling]
            const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
            const icon = getMainstatIcon(mainstatKey)
            const statTitle = scaledSubstat
              ? `Level scaling: +${scaledSubstat} per 10 levels to Lv. 60`
              : undefined
            return (
              <div className='flex items-center justify-between text-[11px]' key={key}>
                <span className='flex items-center gap-1.5 text-slate-500'>
                  {icon ? (
                    <img
                      alt=''
                      className='h-3.5 w-3.5 object-contain opacity-60'
                      draggable={false}
                      src={icon}
                    />
                  ) : null}
                  {STAT_LABELS[key]}
                </span>
                <span
                  className={scaledSubstat ? SIDEBAR_SCALING_VALUE_CLASS : SIDEBAR_STAT_VALUE_CLASS}
                  title={statTitle}
                >
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className='text-[11px] text-slate-500'>Loading...</p>
      )}
      {hasSubstatScaling ? <ScalingInfoButton scalingRecord={scalingRecord} /> : null}
    </div>
  )

  return (
    <div className='flex shrink-0 flex-col gap-2.5'>
      {!compact ? (
        <div className='h-[16.5rem] w-full overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 lg:h-[17.5rem]'>
          {cardAsset ? (
            <img
              alt={`${displayName} card`}
              className='h-full w-full object-cover object-top'
              draggable={false}
              src={cardAsset}
            />
          ) : (
            <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
          )}
        </div>
      ) : null}
      {compact ? attributesSection : progressionSection}
      {compact ? progressionSection : attributesSection}
    </div>
  )
}
