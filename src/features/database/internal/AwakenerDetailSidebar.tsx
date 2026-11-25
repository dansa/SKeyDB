import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerProfile} from '@/domain/awakeners-full'
import type {ScalingInfoRecord} from '@/domain/database-scaling-info'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {AwakenerDetailProfileFacts} from './AwakenerDetailProfileFacts'
import {AwakenerDetailStateControls} from './AwakenerDetailStateControls'
import {AwakenerDetailStatsPanel} from './AwakenerDetailStatsPanel'
import {AwakenerPsycheSurgeStepper} from './AwakenerPsycheSurgeStepper'

interface AwakenerDetailSidebarProps {
  awakener: Awakener
  controls: AwakenerDatabaseControls
  selection: AwakenerDatabaseSelection
  onPatchSelection: (nextPartial: Partial<AwakenerDatabaseSelection>) => void
  onOpenFullArt?: () => void
  formArt?: {asset: string; name: string}
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
  compact?: boolean
  collapseProgression?: boolean
  profile?: AwakenerProfile | null
  statsNote?: string
  variant?: 'progression' | 'profile'
  areStatsExpanded?: boolean
  onStatsExpandedChange?: (isExpanded: boolean) => void
}

export function AwakenerDetailSidebar({
  awakener,
  controls,
  selection,
  onPatchSelection,
  onOpenFullArt,
  formArt,
  stats,
  substatScaling,
  scalingRecord,
  compact,
  collapseProgression,
  profile,
  statsNote,
  variant = 'progression',
  areStatsExpanded,
  onStatsExpandedChange,
}: AwakenerDetailSidebarProps) {
  const displayName = formArt?.name ?? formatAwakenerNameForUi(awakener.name)
  const cardAsset = formArt?.asset ?? getAwakenerCardAsset(awakener.name)
  const fullArtLabel = `View full art for ${displayName}`
  const progressionControls = (
    <AwakenerDetailStateControls
      compact={compact}
      controls={controls}
      onPatchSelection={onPatchSelection}
      selection={selection}
    />
  )
  const progressionSection = collapseProgression ? (
    <details className='border border-slate-600/40 bg-slate-900/30'>
      <summary className='cursor-pointer px-3 py-2.5 text-sm text-slate-200'>
        Progression
        <span className='ml-2 text-xs text-slate-400'>Skill Lv. {selection.skillLevel}</span>
      </summary>
      <div className='border-t border-slate-600/40 p-3'>{progressionControls}</div>
    </details>
  ) : (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2'>
      {progressionControls}
    </div>
  )

  const statsSection = (
    <AwakenerDetailStatsPanel
      action={
        controls.canAdjustPsycheSurge ? (
          <AwakenerPsycheSurgeStepper
            max={controls.psycheSurgeOffsetMax}
            min={controls.psycheSurgeOffsetMin}
            offset={selection.psycheSurgeOffset}
            onChange={(psycheSurgeOffset) => {
              onPatchSelection({psycheSurgeOffset})
            }}
          />
        ) : null
      }
      compact={compact}
      gnosticPotentialLevel={selection.gnosticPotentialLevel}
      isExpanded={areStatsExpanded}
      note={statsNote}
      onExpandedChange={onStatsExpandedChange}
      scalingRecord={scalingRecord}
      stats={stats}
      substatScaling={substatScaling}
    />
  )
  const profileSection = (
    <AwakenerDetailProfileFacts profile={profile} releaseDate={awakener.releaseDate} />
  )

  return (
    <div className='flex shrink-0 flex-col gap-2.5'>
      {!compact ? (
        <div className='h-[16.5rem] w-full overflow-hidden border border-slate-500/40 bg-linear-to-b from-slate-800 to-slate-900 lg:h-[17.5rem]'>
          {cardAsset && onOpenFullArt ? (
            <button
              aria-label={fullArtLabel}
              className='block h-full w-full'
              onClick={onOpenFullArt}
              type='button'
            >
              <img
                alt=''
                className='h-full w-full object-cover object-top'
                draggable={false}
                src={cardAsset}
              />
            </button>
          ) : cardAsset ? (
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
      {variant === 'profile' ? profileSection : null}
      {!compact && variant === 'progression' ? progressionSection : null}
      {statsSection}
      {compact ? progressionSection : null}
    </div>
  )
}
