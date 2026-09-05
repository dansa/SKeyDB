import type {AwakenerDatabaseSelection} from '@/domain/awakener-database-state'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullRecord} from '@/domain/awakeners-full'
import type {ScalingInfoRecord} from '@/domain/database-scaling-info'

import {AwakenerDetailProfileFacts} from './AwakenerDetailProfileFacts'
import {AwakenerDetailStatsPanel} from './AwakenerDetailStatsPanel'
import type {FontScale} from './font-scale'

interface AwakenerDetailOverviewProps {
  awakener: Awakener
  areStatsExpanded?: boolean
  fullData: AwakenerFullRecord
  fontScale: FontScale
  onStatsExpandedChange?: (isExpanded: boolean) => void
  selection?: AwakenerDatabaseSelection
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
}

export function AwakenerDetailOverview({
  awakener,
  areStatsExpanded,
  fullData,
  onStatsExpandedChange,
  selection,
  scalingRecord,
  stats,
  substatScaling,
}: AwakenerDetailOverviewProps) {
  const profile = fullData.profile

  if (!profile) {
    return (
      <div className='space-y-3'>
        <AwakenerDetailStatsPanel
          compact
          gnosticPotentialLevel={selection?.gnosticPotentialLevel}
          isExpanded={areStatsExpanded}
          onExpandedChange={onStatsExpandedChange}
          scalingRecord={scalingRecord}
          stats={stats}
          substatScaling={substatScaling}
        />
        <p className='text-xs text-slate-400'>No profile data available yet.</p>
      </div>
    )
  }

  return (
    <div className='mt-5 space-y-3'>
      <AwakenerDetailProfileFacts compact releaseDate={awakener.releaseDate} profile={profile} />
      <AwakenerDetailStatsPanel
        compact
        gnosticPotentialLevel={selection?.gnosticPotentialLevel}
        isExpanded={areStatsExpanded}
        onExpandedChange={onStatsExpandedChange}
        scalingRecord={scalingRecord}
        stats={stats}
        substatScaling={substatScaling}
      />
    </div>
  )
}
