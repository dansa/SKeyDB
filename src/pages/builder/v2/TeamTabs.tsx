import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamId, selectTeams} from './store/selectors'

interface TeamTabsProps {
  variant?: 'compact' | 'default'
  className?: string
  compactLayout?: 'auto' | 'single-row-flex' | 'two-row-grid'
}

export function TeamTabs({
  variant = 'default',
  className = '',
  compactLayout = 'auto',
}: TeamTabsProps) {
  const teams = useBuilderStore(selectTeams)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const setActiveTeamId = useBuilderStore((s) => s.setActiveTeamId)
  const addTeam = useBuilderStore((s) => s.addTeam)

  const isCompact = variant === 'compact'
  const teamButtons = teams.map((team) => {
    const isActive = team.id === activeTeamId
    return (
      <button
        className={`shrink-0 text-xs whitespace-nowrap ${
          isCompact
            ? `flex h-[38px] w-full min-w-0 items-center border border-transparent px-3 ${
                isActive
                  ? 'border-b-2 border-b-amber-400 bg-slate-900/90 text-amber-400'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200'
              }`
            : `px-3 py-1.5 ${
                isActive
                  ? 'border border-b-0 border-slate-500/45 bg-slate-900/60 text-amber-100'
                  : 'border border-transparent text-slate-400 hover:text-slate-200'
              }`
        }`}
        key={team.id}
        onClick={() => {
          setActiveTeamId(team.id)
        }}
        title={isCompact ? team.name : undefined}
        style={
          isCompact && isActive
            ? {
                borderColor: 'color-mix(in oklab, rgb(100 116 139) 70%, rgb(15 23 42))',
                borderBottomColor: '#fbbf24',
              }
            : undefined
        }
        type='button'
      >
        <span className={isCompact ? 'block min-w-0 truncate' : undefined}>{team.name}</span>
      </button>
    )
  })

  const addTeamButton = (
    <button
      className={`shrink-0 text-sm text-slate-400 hover:text-slate-200 ${
        isCompact
          ? 'flex h-[38px] w-full min-w-0 items-center justify-center border border-slate-500/30 bg-slate-950/45 px-3'
          : 'border border-transparent px-3 py-1.5'
      }`}
      key='add-team'
      onClick={addTeam}
      type='button'
    >
      +
    </button>
  )

  if (!isCompact) {
    return (
      <div className={`flex overflow-x-auto ${className}`}>
        {teamButtons}
        {addTeamButton}
      </div>
    )
  }

  const compactItems = [...teamButtons, addTeamButton]
  const resolvedCompactLayout =
    compactLayout === 'auto'
      ? compactItems.length <= 3
        ? 'single-row-flex'
        : 'two-row-grid'
      : compactLayout
  const columnCount = Math.ceil(compactItems.length / 2)

  if (resolvedCompactLayout === 'single-row-flex') {
    return (
      <div
        className={`flex items-stretch gap-1 ${className}`}
        data-compact-layout='single-row-flex'
        data-testid='team-tabs-compact'
      >
        {teamButtons.map((button) => (
          <div className='min-w-0 flex-1' key={button.key}>
            {button}
          </div>
        ))}
        <div className='shrink-0 basis-10'>{addTeamButton}</div>
      </div>
    )
  }

  return (
    <div
      className={`grid auto-rows-fr grid-rows-2 gap-1 ${className}`}
      data-compact-layout='two-row-grid'
      data-testid='team-tabs-compact'
      style={{gridTemplateColumns: `repeat(${String(columnCount)}, minmax(0, 1fr))`}}
    >
      {compactItems}
    </div>
  )
}
