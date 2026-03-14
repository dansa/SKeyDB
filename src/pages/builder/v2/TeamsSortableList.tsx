import type {ReactNode} from 'react'

import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable'

import type {Team} from '../types'

interface TeamsSortableListProps {
  teams: Team[]
  renderTeamRow: (team: Team, index: number) => ReactNode
}

export function TeamsSortableList({teams, renderTeamRow}: TeamsSortableListProps) {
  return (
    <SortableContext items={teams.map((team) => team.id)} strategy={verticalListSortingStrategy}>
      <div className='space-y-2'>{teams.map((team, index) => renderTeamRow(team, index))}</div>
    </SortableContext>
  )
}
