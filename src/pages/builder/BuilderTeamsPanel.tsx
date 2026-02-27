import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getPosseAssetById } from '../../domain/posse-assets'
import type { Posse } from '../../domain/posses'
import type { TeamTemplateId } from './team-collection'
import { MAX_TEAMS } from './team-collection'
import { BuilderTeamRow } from './BuilderTeamRow'
import type { Team } from './types'

type BuilderTeamsPanelProps = {
  teams: Team[]
  activeTeamId: string
  editingTeamId: string | null
  editingTeamName: string
  editingTeamSurface: 'header' | 'list' | null
  posses: Posse[]
  ownedAwakenerLevelByName?: Map<string, number | null>
  ownedPosseLevelById?: Map<string, number | null>
  onAddTeam: () => void
  onApplyTeamTemplate: (templateId: TeamTemplateId) => void
  onExportTeam: (teamId: string) => void
  onResetTeam: (teamId: string, teamName: string) => void
  onEditingTeamNameChange: (nextName: string) => void
  onBeginTeamRename: (teamId: string, currentName: string, surface?: 'header' | 'list') => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditTeam: (teamId: string) => void
  onDeleteTeam: (teamId: string, teamName: string) => void
}

const EMPTY_OWNERSHIP_MAP = new Map<string, number | null>()

export function BuilderTeamsPanel({
  teams,
  activeTeamId,
  editingTeamId,
  editingTeamName,
  editingTeamSurface,
  posses,
  ownedAwakenerLevelByName = EMPTY_OWNERSHIP_MAP,
  ownedPosseLevelById = EMPTY_OWNERSHIP_MAP,
  onAddTeam,
  onApplyTeamTemplate,
  onExportTeam,
  onResetTeam,
  onEditingTeamNameChange,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditTeam,
  onDeleteTeam,
}: BuilderTeamsPanelProps) {
  return (
    <div className="border border-slate-500/45 bg-slate-900/45 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-300">Teams ({teams.length}/{MAX_TEAMS})</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Templates:</span>
            <button
              className="border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40"
              onClick={() => onApplyTeamTemplate('DTIDE_5')}
              type="button"
            >
              D-Tide 5
            </button>
            <button
              className="border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40"
              onClick={() => onApplyTeamTemplate('DTIDE_10')}
              type="button"
            >
              D-Tide 10
            </button>
          </div>
          <span aria-hidden className="h-5 w-px bg-slate-500/45" />
          <button
            className="border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40"
            disabled={teams.length >= MAX_TEAMS}
            onClick={onAddTeam}
            type="button"
          >
            + Add Team
          </button>
        </div>
      </div>
      <SortableContext items={teams.map((team) => team.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-2 space-y-2">
          {teams.map((team) => {
            const isEditingTeamName = editingTeamId === team.id && editingTeamSurface === 'list'
            const posse = team.posseId ? posses.find((entry) => entry.id === team.posseId) : undefined
            const posseAsset = posse ? getPosseAssetById(posse.id) : undefined
            return (
              <BuilderTeamRow
                deleteDisabled={teams.length <= 1}
                editingTeamName={editingTeamName}
                isActive={team.id === activeTeamId}
                isEditingTeamName={isEditingTeamName}
                key={team.id}
                ownedAwakenerLevelByName={ownedAwakenerLevelByName}
                ownedPosseLevelById={ownedPosseLevelById}
                onBeginTeamRename={onBeginTeamRename}
                onCancelTeamRename={onCancelTeamRename}
                onCommitTeamRename={onCommitTeamRename}
                onDeleteTeam={onDeleteTeam}
                onEditTeam={onEditTeam}
                onEditingTeamNameChange={onEditingTeamNameChange}
                onExportTeam={onExportTeam}
                onResetTeam={onResetTeam}
                posseAsset={posseAsset}
                team={team}
              />
            )
          })}
        </div>
      </SortableContext>
    </div>
  )
}
