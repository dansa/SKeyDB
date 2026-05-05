import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable'

import {SegmentedControl} from '@/components/ui/SegmentedControl'
import {getPosseAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'

import {BuilderTeamRow} from './BuilderTeamRow'
import {MAX_TEAMS, type TeamTemplateId} from './team-collection'
import type {Team, TeamPreviewMode} from './types'

interface BuilderTeamsPanelProps {
  teams: Team[]
  activeTeamId: string
  editingTeamId: string | null
  editingTeamName: string
  editingTeamSurface: 'header' | 'list' | null
  posses: Posse[]
  ownedAwakenerLevelByName?: Map<string, number | null>
  ownedWheelLevelById?: Map<string, number | null>
  ownedPosseLevelById?: Map<string, number | null>
  teamPreviewMode: TeamPreviewMode
  onAddTeam: () => void
  onApplyTeamTemplate: (templateId: TeamTemplateId) => void
  onExportTeam: (teamId: string) => void
  onResetTeam: (teamId: string, teamName: string) => void
  onTeamPreviewModeChange: (nextMode: TeamPreviewMode) => void
  onEditingTeamNameChange: (nextName: string) => void
  onBeginTeamRename: (teamId: string, currentName: string, surface?: 'header' | 'list') => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditTeam: (teamId: string) => void
  onDeleteTeam: (teamId: string, teamName: string) => void
}

const EMPTY_OWNERSHIP_MAP = new Map<string, number | null>()
const teamPreviewModeOptions = [
  {value: 'compact', label: 'Compact'},
  {value: 'expanded', label: 'Expanded'},
] as const

export function BuilderTeamsPanel({
  teams,
  activeTeamId,
  editingTeamId,
  editingTeamName,
  editingTeamSurface,
  posses,
  ownedAwakenerLevelByName = EMPTY_OWNERSHIP_MAP,
  ownedWheelLevelById = EMPTY_OWNERSHIP_MAP,
  ownedPosseLevelById = EMPTY_OWNERSHIP_MAP,
  teamPreviewMode,
  onAddTeam,
  onApplyTeamTemplate,
  onExportTeam,
  onResetTeam,
  onTeamPreviewModeChange,
  onEditingTeamNameChange,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditTeam,
  onDeleteTeam,
}: BuilderTeamsPanelProps) {
  return (
    <div className='border border-slate-500/45 bg-slate-900/45 p-3'>
      <div className='flex items-center justify-between'>
        <p className='text-xs tracking-wide text-slate-300 uppercase'>
          Teams ({teams.length}/{MAX_TEAMS})
        </p>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1.5'>
            <span className='text-[10px] tracking-wide text-slate-400 uppercase'>View:</span>
            <SegmentedControl
              activeButtonClassName='builder-team-preview-mode-button-active'
              ariaLabel='Team preview mode'
              buttonClassName='builder-team-preview-mode-button'
              className='builder-team-preview-mode-toggle'
              onChange={onTeamPreviewModeChange}
              options={teamPreviewModeOptions}
              value={teamPreviewMode}
            />
          </div>
          <span aria-hidden className='h-5 w-px bg-slate-500/45' />
          <div className='flex items-center gap-1'>
            <span className='text-[10px] tracking-wide text-slate-400 uppercase'>Templates:</span>
            <button
              className='border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40'
              onClick={() => {
                onApplyTeamTemplate('DTIDE_5')
              }}
              type='button'
            >
              D-Tide 5
            </button>
            <button
              className='border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40'
              onClick={() => {
                onApplyTeamTemplate('DTIDE_10')
              }}
              type='button'
            >
              D-Tide 10
            </button>
          </div>
          <span aria-hidden className='h-5 w-px bg-slate-500/45' />
          <button
            className='border border-slate-500/45 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-40'
            disabled={teams.length >= MAX_TEAMS}
            onClick={onAddTeam}
            type='button'
          >
            + Add Team
          </button>
        </div>
      </div>
      <SortableContext items={teams.map((team) => team.id)} strategy={verticalListSortingStrategy}>
        <div className='mt-2 space-y-2'>
          {teams.map((team) => {
            const isEditingTeamName = editingTeamId === team.id && editingTeamSurface === 'list'
            const posse = team.posseId
              ? posses.find((entry) => entry.id === team.posseId)
              : undefined
            const posseAsset = posse ? getPosseAssetById(posse.id) : undefined
            return (
              <BuilderTeamRow
                deleteDisabled={teams.length <= 1}
                editingTeamName={editingTeamName}
                isActive={team.id === activeTeamId}
                isEditingTeamName={isEditingTeamName}
                key={team.id}
                ownedAwakenerLevelByName={ownedAwakenerLevelByName}
                ownedWheelLevelById={ownedWheelLevelById}
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
                teamPreviewMode={teamPreviewMode}
              />
            )
          })}
        </div>
      </SortableContext>
    </div>
  )
}
