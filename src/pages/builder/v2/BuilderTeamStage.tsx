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
  tabsVariant?: 'default' | 'tablet'
  fitGridToHeight?: boolean
  actionBarPlacement?: 'bottom' | 'top'
}

export function BuilderTeamStage({
  compact = false,
  onRequestResetTeam = () => undefined,
  tabsVariant,
  fitGridToHeight = false,
  actionBarPlacement,
}: BuilderTeamStageProps) {
  const {height: availableGridHeight, ref: gridRegionRef} = useMeasuredElementInnerHeight()
  const activeTeam = useBuilderStore(selectActiveTeam)
  const slots = useBuilderStore(selectActiveTeamSlots)
  const isQuickLineupActive = useBuilderStore(selectIsQuickLineupActive)
  const startQuickLineup = useBuilderStore((state) => state.startQuickLineup)
  const usesFittedGrid = compact || fitGridToHeight
  const resolvedActionBarPlacement = actionBarPlacement ?? (compact ? 'top' : 'bottom')
  const resolvedTabsVariant = tabsVariant ?? (compact ? 'tablet' : 'default')
  const stageClassName = compact
    ? 'flex h-full min-h-0 flex-col bg-slate-900/45'
    : 'border border-slate-500/45 bg-slate-900/45 shadow-[0_18px_50px_rgba(2,6,23,0.32)]'

  return (
    <section
      className={stageClassName}
      data-builder-stage-density={compact ? 'compact' : 'default'}
      data-testid='builder-team-stage'
    >
      <TeamTabs
        className={compact ? '' : 'border-b border-slate-500/45 bg-slate-950/72'}
        variant={resolvedTabsVariant}
      />

      <div className='border-b border-slate-500/45'>
        <BuilderV2ActiveTeamHeader compact={compact} />
      </div>

      {resolvedActionBarPlacement === 'top' && activeTeam ? (
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
        className={
          usesFittedGrid
            ? 'min-h-0 flex-1 px-1.5 py-1 sm:px-2'
            : 'overflow-x-auto px-5 py-5 xl:px-6'
        }
        ref={usesFittedGrid ? gridRegionRef : undefined}
      >
        <div
          className={
            usesFittedGrid
              ? `mx-auto w-full min-w-0 ${compact ? 'max-w-[44rem]' : 'max-w-[48rem]'}`
              : 'mx-auto min-w-[40rem]'
          }
        >
          <BuilderCardGrid
            availableHeight={usesFittedGrid ? availableGridHeight : 0}
            compact={usesFittedGrid}
          />
        </div>
      </div>

      {resolvedActionBarPlacement === 'bottom' ? (
        <div className='border-t border-slate-500/45'>
          {activeTeam && !isQuickLineupActive ? (
            <CurrentTeamActionBar
              dense
              onQuickLineup={() => {
                startQuickLineup(buildQuickLineupSteps(slots))
              }}
              onRequestResetTeam={onRequestResetTeam}
              placement='bottom'
              showRename={false}
              teamId={activeTeam.id}
              teamName={activeTeam.name}
            />
          ) : (
            <BuilderQuickLineupControls appearance='tablet' compact={compact} />
          )}
        </div>
      ) : null}
    </section>
  )
}
