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
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
  compact?: boolean
  profile?: AwakenerProfile | null
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
  stats,
  substatScaling,
  scalingRecord,
  compact,
  profile,
  variant = 'progression',
  areStatsExpanded,
  onStatsExpandedChange,
}: AwakenerDetailSidebarProps) {
  const displayName = formatAwakenerNameForUi(awakener.name)
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const fullArtLabel = `View full art for ${displayName}`
  const progressionSection = (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2'>
      <AwakenerDetailStateControls
        compact={compact}
        controls={controls}
        onPatchSelection={onPatchSelection}
        selection={selection}
      />
    </div>
  )

  const statsSection = (
    <AwakenerDetailStatsPanel
      action={
        controls.canAdjustPsycheSurge ? (
          <AwakenerPsycheSurgeStepper
            offset={selection.psycheSurgeOffset}
            onDecrease={() => {
              onPatchSelection({psycheSurgeOffset: selection.psycheSurgeOffset - 1})
            }}
            onIncrease={() => {
              onPatchSelection({psycheSurgeOffset: selection.psycheSurgeOffset + 1})
            }}
          />
        ) : null
      }
      compact={compact}
      isExpanded={areStatsExpanded}
      onExpandedChange={onStatsExpandedChange}
      scalingRecord={scalingRecord}
      stats={stats}
      substatScaling={substatScaling}
    />
  )
  const profileSection = <AwakenerDetailProfileFacts profile={profile} />

  return (
    <div className='flex shrink-0 flex-col gap-2.5'>
      {!compact ? (
        <div className='h-[16.5rem] w-full overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 lg:h-[17.5rem]'>
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
      {compact || variant === 'profile' ? statsSection : progressionSection}
      {compact || variant === 'profile' ? null : statsSection}
      {compact ? progressionSection : null}
    </div>
  )
}
