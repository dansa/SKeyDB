import {buildQuickLineupSteps} from '../quick-lineup'
import {BuilderCardGrid} from './BuilderCardGrid'
import {BuilderQuickLineupControls} from './BuilderQuickLineupControls'
import {BuilderV2ActiveTeamHeader} from './BuilderV2ActiveTeamHeader'
import {CurrentTeamActionBar} from './CurrentTeamActionBar'
import {useMeasuredElementInnerHeight} from './layout-hooks'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeam, selectActiveTeamSlots, selectIsQuickLineupActive} from './store/selectors'
import {TeamTabs} from './TeamTabs'

interface BuilderTeamStageProps {
  compact?: boolean
  onRequestResetTeam?: (teamId: string, teamName: string) => void
}

export function BuilderTeamStage({
  compact = false,
  onRequestResetTeam = () => undefined,
}: BuilderTeamStageProps) {
  const {height: availableGridHeight, ref: gridRegionRef} = useMeasuredElementInnerHeight()
  const activeTeam = useBuilderStore(selectActiveTeam)
  const slots = useBuilderStore(selectActiveTeamSlots)
  const isQuickLineupActive = useBuilderStore(selectIsQuickLineupActive)
  const startQuickLineup = useBuilderStore((state) => state.startQuickLineup)
  const stageClassName = compact
    ? 'flex h-full min-h-0 flex-col bg-slate-900/45'
    : 'border border-slate-500/45 bg-slate-900/45'

  return (
    <section
      className={stageClassName}
      data-builder-stage-density={compact ? 'compact' : 'default'}
      data-testid='builder-team-stage'
    >
      <TeamTabs
        className={compact ? '' : 'border-b border-slate-500/45'}
        variant={compact ? 'tablet' : 'default'}
      />

      <div className='border-b border-slate-500/45'>
        <BuilderV2ActiveTeamHeader compact={compact} />
      </div>

      {compact && activeTeam ? (
        isQuickLineupActive ? (
          <div className='border-b border-slate-500/45 bg-slate-950/45'>
            <BuilderQuickLineupControls compact placement='top' />
          </div>
        ) : (
          <CurrentTeamActionBar
            onQuickLineup={() => {
              startQuickLineup(buildQuickLineupSteps(slots))
            }}
            onRequestResetTeam={onRequestResetTeam}
            teamId={activeTeam.id}
            teamName={activeTeam.name}
          />
        )
      ) : null}

      <div
        className={compact ? 'min-h-0 flex-1 px-1.5 py-1 sm:px-2' : 'overflow-x-auto px-4 py-4'}
        ref={compact ? gridRegionRef : undefined}
      >
        <div className={compact ? 'mx-auto w-full max-w-[44rem] min-w-0' : 'min-w-[40rem]'}>
          <BuilderCardGrid availableHeight={compact ? availableGridHeight : 0} compact={compact} />
        </div>
      </div>

      {!compact ? (
        <div className='border-t border-slate-500/45'>
          <BuilderQuickLineupControls compact={compact} />
        </div>
      ) : null}
    </section>
  )
}
