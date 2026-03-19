import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamId, selectTeams} from './store/selectors'

interface TeamTabsProps {
  variant?: 'compact' | 'default' | 'tablet'
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
  const isTablet = variant === 'tablet'
  const shouldCapTabletTabWidth = isTablet && teams.length <= 6
  const teamButtons = teams.map((team) => {
    const isActive = team.id === activeTeamId
    return (
      <button
        className={`shrink-0 whitespace-nowrap transition-[background-color,border-color,color,filter,box-shadow] ${
          isTablet
            ? `flex h-7 w-full min-w-0 items-center justify-center border-r border-b-2 border-r-slate-500/30 px-1.5 text-[11px] ${
                isActive
                  ? 'border-b-amber-400 bg-slate-900/92 text-slate-100 shadow-[inset_0_-1px_0_0_rgba(251,191,36,0.45)]'
                  : 'border-b-transparent bg-slate-950/35 text-slate-400 hover:border-b-amber-300/45 hover:bg-slate-900/55 hover:text-slate-200'
              }`
            : isCompact
              ? `flex h-[38px] w-full min-w-0 items-center border px-3 text-xs ${
                  isActive
                    ? 'border-b-2 border-transparent border-b-amber-400 bg-slate-900/90 text-amber-400 shadow-[inset_0_-1px_0_0_rgba(251,191,36,0.45)]'
                    : 'border-slate-500/30 bg-slate-950/70 text-slate-400 hover:border-amber-300/45 hover:bg-slate-900/75 hover:text-slate-200'
                }`
              : `border px-3 py-1.5 text-xs ${
                  isActive
                    ? 'border border-b-0 border-slate-500/45 bg-slate-900/60 text-amber-100'
                    : 'border-transparent text-slate-400 hover:border-slate-500/35 hover:bg-slate-900/35 hover:text-slate-200'
                }`
        }`}
        key={team.id}
        onClick={() => {
          setActiveTeamId(team.id)
        }}
        title={isCompact || isTablet ? team.name : undefined}
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
        <span className={isCompact || isTablet ? 'block min-w-0 truncate' : undefined}>
          {team.name}
        </span>
      </button>
    )
  })

  const addTeamButton = (
    <button
      className={`shrink-0 text-sm text-slate-400 transition-[background-color,border-color,color] hover:text-slate-200 ${
        isTablet
          ? 'flex h-7 w-9 min-w-9 items-center justify-center border-b-2 border-l border-slate-500/30 border-b-transparent bg-slate-950/45 hover:border-b-amber-300/45 hover:bg-slate-900/75'
          : isCompact
            ? 'flex h-[38px] w-full min-w-0 items-center justify-center border border-slate-500/30 bg-slate-950/45 px-3 hover:border-amber-300/45 hover:bg-slate-900/72'
            : 'border border-transparent px-3 py-1.5 hover:border-slate-500/35 hover:bg-slate-900/35'
      }`}
      key='add-team'
      onClick={addTeam}
      type='button'
    >
      <span className='pointer-events-none text-base leading-none'>+</span>
    </button>
  )

  if (!isCompact && !isTablet) {
    return (
      <div className={`flex overflow-x-auto ${className}`}>
        {teamButtons}
        {addTeamButton}
      </div>
    )
  }

  if (isTablet) {
    return (
      <div
        className={`flex items-stretch overflow-hidden border-b border-slate-500/45 bg-slate-950/78 ${className}`}
        data-compact-layout='single-row-flex'
        data-builder-tabs-fit='true'
        data-builder-tabs-variant='tablet'
        data-testid='team-tabs-compact'
      >
        {teamButtons.map((button) => (
          <div
            className={shouldCapTabletTabWidth ? 'max-w-[8rem] min-w-0 flex-1' : 'min-w-0 flex-1'}
            key={button.key}
          >
            {button}
          </div>
        ))}
        {shouldCapTabletTabWidth ? (
          <div
            aria-hidden
            className='min-w-0 flex-1 border-b-2 border-b-transparent bg-slate-950/35'
          />
        ) : null}
        <div className='shrink-0'>{addTeamButton}</div>
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
