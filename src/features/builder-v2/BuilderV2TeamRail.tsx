import type {CSSProperties} from 'react'

import {
  getBuilderV2TeamRailClassName,
  getBuilderV2TeamRailDensity,
} from './builder-v2-team-rail-density'
import type {BuilderV2TeamSummary} from './BuilderV2ModelTypes'

interface BuilderV2TeamRailProps {
  canAddTeam: boolean
  maxTeams: number
  onAddTeam: () => void
  onSetActiveTeam: (teamId: string) => void
  onTeamActivated?: () => void
  teams: BuilderV2TeamSummary[]
}

export function BuilderV2TeamRail({
  canAddTeam,
  maxTeams,
  onAddTeam,
  onSetActiveTeam,
  onTeamActivated,
  teams,
}: BuilderV2TeamRailProps) {
  const railDensity = getBuilderV2TeamRailDensity({
    canAddTeam,
    maxTeams,
    teamCount: teams.length,
  })
  const railStyle = {
    '--builder-v2-team-rail-middle-row-count': railDensity.middleRowCount,
  } as CSSProperties

  return (
    <aside
      className={getBuilderV2TeamRailClassName(railDensity)}
      aria-label='My teams'
      style={railStyle}
    >
      <div className='builder-v2-team-list'>
        {teams.map((team, index) => {
          const teamIndex = String(index + 1).padStart(2, '0')
          const teamMeta = `${String(team.deployedCount)} / 4 deployed`

          return (
            <button
              aria-label={`${teamIndex} ${team.name} ${teamMeta}`}
              aria-pressed={team.isActive}
              className={`builder-v2-team-row ${
                team.isActive ? 'builder-v2-team-row--active' : ''
              }`}
              key={team.id}
              onClick={() => {
                onSetActiveTeam(team.id)
                onTeamActivated?.()
              }}
              type='button'
            >
              <span className='builder-v2-team-index'>{teamIndex}</span>
            </button>
          )
        })}
        {canAddTeam ? (
          <button
            aria-label='Create team'
            className='builder-v2-team-row builder-v2-team-row--add'
            onClick={onAddTeam}
            type='button'
          >
            <span className='builder-v2-team-index'>+</span>
          </button>
        ) : null}
      </div>
    </aside>
  )
}
