import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamId, selectTeams} from './store/selectors'

interface TeamTabsProps {
  variant?: 'compact' | 'default'
  className?: string
}

export function TeamTabs({variant = 'default', className = ''}: TeamTabsProps) {
  const teams = useBuilderStore(selectTeams)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const setActiveTeamId = useBuilderStore((s) => s.setActiveTeamId)
  const addTeam = useBuilderStore((s) => s.addTeam)

  const isCompact = variant === 'compact'
  const containerClassName = isCompact ? 'flex flex-wrap gap-1' : 'flex overflow-x-auto'

  return (
    <div className={`${containerClassName} ${className}`}>
      {teams.map((team) => {
        const isActive = team.id === activeTeamId
        return (
          <button
            className={`shrink-0 text-xs whitespace-nowrap ${
              isCompact
                ? `flex h-[38px] max-w-[11rem] min-w-0 items-center border border-transparent px-3 ${
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
            <span className={isCompact ? 'block truncate' : undefined}>{team.name}</span>
          </button>
        )
      })}
      <button
        className={`shrink-0 text-sm text-slate-400 hover:text-slate-200 ${
          isCompact ? 'flex h-[38px] items-center px-3' : 'border border-transparent px-3 py-1.5'
        }`}
        onClick={addTeam}
        type='button'
      >
        +
      </button>
    </div>
  )
}
