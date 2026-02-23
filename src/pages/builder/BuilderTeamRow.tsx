import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import tempPosseIcon from '../../assets/posse/00-temposse.png'
import { getAwakenerPortraitAsset } from '../../domain/awakener-assets'
import { getFactionTint } from '../../domain/factions'
import type { Team } from './types'

type BuilderTeamRowProps = {
  team: Team
  isActive: boolean
  isEditingTeamName: boolean
  editingTeamName: string
  posseAsset?: string
  ownedAwakenerLevelByName?: Map<string, number | null>
  ownedPosseLevelById?: Map<string, number | null>
  onEditingTeamNameChange: (nextName: string) => void
  onBeginTeamRename: (teamId: string, currentName: string) => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditTeam: (teamId: string) => void
  onExportTeam: (teamId: string) => void
  onDeleteTeam: (teamId: string, teamName: string) => void
  deleteDisabled: boolean
}

const EMPTY_OWNERSHIP_MAP = new Map<string, number | null>()

export function BuilderTeamRow({
  team,
  isActive,
  isEditingTeamName,
  editingTeamName,
  posseAsset,
  ownedAwakenerLevelByName = EMPTY_OWNERSHIP_MAP,
  ownedPosseLevelById = EMPTY_OWNERSHIP_MAP,
  onEditingTeamNameChange,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditTeam,
  onExportTeam,
  onDeleteTeam,
  deleteDisabled,
}: BuilderTeamRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
    data: { kind: 'team-row', teamId: team.id },
  })
  const hasMeaningfulTransform =
    !!transform &&
    (Math.abs(transform.x) > 0.01 ||
      Math.abs(transform.y) > 0.01 ||
      Math.abs(transform.scaleX - 1) > 0.001 ||
      Math.abs(transform.scaleY - 1) > 0.001)
  const isPosseOwned = !team.posseId || (ownedPosseLevelById?.get(team.posseId) ?? null) !== null

  return (
    <div
      className={`group flex items-stretch gap-0 ${
        isActive ? 'shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_10px_rgba(251,191,36,0.22)]' : ''
      } ${isDragging ? 'z-20 opacity-80' : ''}`}
      data-team-id={team.id}
      data-team-name={team.name}
      ref={setNodeRef}
      style={{
        transform: hasMeaningfulTransform ? CSS.Transform.toString(transform) : undefined,
        transition: hasMeaningfulTransform || isDragging ? transition : undefined,
      }}
    >
      <button
        aria-label={`Reorder ${team.name}`}
        data-active={isActive ? 'true' : 'false'}
        className={`builder-team-row-drag-handle border ${
          isActive
            ? 'border-amber-200/80 bg-slate-800/70'
            : 'border-slate-500/45 bg-slate-900/50'
        }`}
        type="button"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true" className="builder-team-row-drag-handle-glyph" />
      </button>
      <div
        className={`grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border pr-2 ${
          isActive
            ? 'border-amber-200/80 border-l-0 bg-slate-800/70'
            : 'border-slate-500/45 border-l-0 bg-slate-900/50'
        }`}
        onClick={() => onEditTeam(team.id)}
      >
        <div className="min-w-0 py-1.5 pl-2">
          <div className="group/teamname flex h-6 w-[210px] max-w-full items-center gap-1">
            {isEditingTeamName ? (
              <>
                <input
                  aria-label="Team name"
                  autoFocus
                  className="h-6 w-[210px] max-w-full border border-amber-200/55 bg-slate-950/90 px-1.5 text-xs text-slate-100 outline-none focus:border-amber-200/75"
                  onClick={(event) => event.stopPropagation()}
                  onBlur={(event) => {
                    const nextTarget = event.relatedTarget
                    if (nextTarget instanceof HTMLElement && nextTarget.dataset.renameAction === 'true') {
                      return
                    }
                    onCommitTeamRename(team.id)
                  }}
                  onChange={(event) => onEditingTeamNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onCommitTeamRename(team.id)
                      return
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      onCancelTeamRename()
                    }
                  }}
                  type="text"
                  value={editingTeamName}
                />
                <button
                  aria-label="Confirm rename"
                  className="builder-team-inline-icon-button text-emerald-300 hover:text-emerald-200"
                  data-rename-action="true"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCommitTeamRename(team.id)
                  }}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 16 16">
                    <path
                      d="M3 8.1 6.6 11.7 13 4.8"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
                <button
                  aria-label="Cancel rename"
                  className="builder-team-inline-icon-button text-rose-300 hover:text-rose-200"
                  data-rename-action="true"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCancelTeamRename()
                  }}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 16 16">
                    <path
                      d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 select-none truncate text-xs leading-none text-slate-100">{team.name}</p>
                <button
                  aria-label={`Rename ${team.name}`}
                  className="builder-team-inline-icon-button shrink-0 text-slate-300/85 opacity-0 hover:text-amber-100 focus-visible:opacity-100 group-hover/teamname:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    onBeginTeamRename(team.id, team.name)
                  }}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 16 16">
                    <path
                      d="M11.9 1.6a1.6 1.6 0 0 1 2.3 2.3L6 12H3v-3l8.9-7.4Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="mt-1 flex gap-1.5">
            {team.slots.map((slot) => {
              const isAwakenerOwned =
                !slot.awakenerName || (ownedAwakenerLevelByName?.get(slot.awakenerName) ?? null) !== null
              return (
              <div className="builder-picker-tile h-12 w-12 border border-slate-500/50 bg-slate-900/40 p-0.5" key={`${team.id}-${slot.slotId}`}>
                <div className="relative h-full w-full overflow-hidden border border-slate-400/35 bg-slate-900/70">
                  {slot.awakenerName ? (
                    <>
                      <img
                        alt={`${slot.awakenerName} team preview portrait`}
                        className={`h-full w-full object-cover ${!isAwakenerOwned ? 'builder-picker-art-unowned' : ''}`}
                        draggable={false}
                        src={getAwakenerPortraitAsset(slot.awakenerName)}
                      />
                      <span
                        className="pointer-events-none absolute inset-0 z-10 border"
                        style={{ borderColor: getFactionTint(slot.faction) }}
                      />
                      {!isAwakenerOwned ? <span className="builder-team-preview-unowned-chip">Unowned</span> : null}
                    </>
                  ) : (
                    <span className="relative block h-full w-full">
                      <span className="sigil-placeholder sigil-placeholder-no-plus" />
                    </span>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
        <span className="builder-team-posse-icon-wrap builder-team-posse-icon-wrap-compact my-1.5">
          <img
            alt={`${team.name} posse`}
            className={`builder-team-posse-icon builder-team-posse-icon-compact ${
              !isPosseOwned ? 'builder-picker-art-unowned builder-team-posse-unowned' : ''
            }`}
            draggable={false}
            src={posseAsset ?? tempPosseIcon}
          />
          {!isPosseOwned ? <span className="builder-team-preview-unowned-chip builder-team-preview-unowned-chip-posse">Unowned</span> : null}
        </span>
        <div className="py-1.5">
          <button
            className="mb-1 block w-full border border-slate-500/45 bg-slate-900/65 px-2 py-1 text-[10px] text-slate-200 transition-colors hover:border-amber-200/45"
            onClick={(event) => {
              event.stopPropagation()
              onExportTeam(team.id)
            }}
            type="button"
          >
            Export
          </button>
          <button
            className="border border-slate-500/45 bg-slate-900/65 px-2 py-1 text-[10px] text-slate-200 transition-colors hover:border-amber-200/45 disabled:opacity-35"
            disabled={deleteDisabled}
            onClick={(event) => {
              event.stopPropagation()
              onDeleteTeam(team.id, team.name)
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
