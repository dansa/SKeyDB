import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getPosseAssetById } from '../../domain/posse-assets'
import type { Posse } from '../../domain/posses'
import { MAX_TEAMS } from './team-collection'
import { BuilderTeamRow } from './BuilderTeamRow'
import type { Team } from './types'

type BuilderTeamsPanelProps = {
  teams: Team[]
  activeTeamId: string
  editingTeamId: string | null
  editingTeamName: string
  posses: Posse[]
  onAddTeam: () => void
  onOpenImport: () => void
  onExportAll: () => void
  onExportTeam: (teamId: string) => void
  onEditingTeamNameChange: (nextName: string) => void
  onBeginTeamRename: (teamId: string, currentName: string) => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditTeam: (teamId: string) => void
  onDeleteTeam: (teamId: string, teamName: string) => void
}

export function BuilderTeamsPanel({
  teams,
  activeTeamId,
  editingTeamId,
  editingTeamName,
  posses,
  onAddTeam,
  onOpenImport,
  onExportAll,
  onExportTeam,
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
        <div className="flex items-center gap-1">
          <button
            className="border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45"
            onClick={onOpenImport}
            type="button"
          >
            Import
          </button>
          <button
            className="border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40"
            disabled={teams.length === 0}
            onClick={onExportAll}
            type="button"
          >
            Export All
          </button>
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
            const isActive = team.id === activeTeamId
            const isEditingTeamName = editingTeamId === team.id
            const posse = team.posseId ? posses.find((entry) => entry.id === team.posseId) : undefined
            const posseAsset = posse ? getPosseAssetById(posse.id) : undefined
            return (
              <BuilderTeamRow
                deleteDisabled={teams.length <= 1}
                editingTeamName={editingTeamName}
                isActive={isActive}
                isEditingTeamName={isEditingTeamName}
                key={team.id}
                onBeginTeamRename={onBeginTeamRename}
                onCancelTeamRename={onCancelTeamRename}
                onCommitTeamRename={onCommitTeamRename}
                onDeleteTeam={onDeleteTeam}
                onEditTeam={onEditTeam}
                onEditingTeamNameChange={onEditingTeamNameChange}
                onExportTeam={onExportTeam}
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
