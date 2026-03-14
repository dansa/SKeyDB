import {useCallback, useState} from 'react'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getRealmTint} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {useInlineEditor} from '@/hooks/useInlineEditor'

import {MAX_TEAMS} from '../team-collection'
import type {Team, TeamSlot} from '../types'
import {SortableTeamRow} from './SortableTeamRow'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamId, selectTeams} from './store/selectors'
import {TeamsSortableList} from './TeamsSortableList'
import {useCollectionOwnership} from './useCollectionOwnership'

type TeamTemplateId = 'DTIDE_5' | 'DTIDE_10'

const TEAM_TEMPLATE_OPTIONS: {id: TeamTemplateId; label: string}[] = [
  {id: 'DTIDE_5', label: 'D-Tide 5'},
  {id: 'DTIDE_10', label: 'D-Tide 10'},
]

function ToolbarButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      className='border border-slate-500/45 bg-slate-950/55 px-2.5 py-1.5 text-[11px] text-slate-200 transition-colors hover:border-amber-300/45 disabled:opacity-40'
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  )
}

function TeamPreviewThumb({slot, isOwned}: {slot: TeamSlot; isOwned: boolean}) {
  if (!slot.awakenerName) {
    return (
      <div className='relative aspect-square overflow-hidden border border-slate-600/50 bg-slate-950/55'>
        <span className='absolute inset-0 flex items-center justify-center text-[10px] text-slate-600'>
          +
        </span>
      </div>
    )
  }

  const label = formatAwakenerNameForUi(slot.awakenerName)

  return (
    <div
      className='relative aspect-square overflow-hidden border bg-slate-950/70'
      style={{borderColor: `${getRealmTint(slot.realm)}66`}}
      title={label}
    >
      <img
        alt={`${label} team preview portrait`}
        className={`h-full w-full object-cover object-top ${isOwned ? '' : 'opacity-45 saturate-50'}`}
        draggable={false}
        src={getAwakenerPortraitAsset(slot.awakenerName)}
      />
      <span
        className='pointer-events-none absolute inset-0 border'
        style={{borderColor: `${getRealmTint(slot.realm)}88`}}
      />
      {slot.isSupport ? (
        <span className='absolute top-0 right-0 border-b border-l border-slate-400/50 bg-slate-950/92 px-1 text-[8px] leading-4 font-bold text-amber-300'>
          S
        </span>
      ) : null}
      {!isOwned ? (
        <span className='absolute inset-x-0 bottom-0 bg-slate-950/88 px-1 py-0.5 text-[8px] text-rose-200'>
          Unowned
        </span>
      ) : null}
    </div>
  )
}

function TeamPreviewStrip({
  team,
  ownedAwakenerLevelByName,
}: {
  team: Team
  ownedAwakenerLevelByName: Map<string, number | null>
}) {
  return (
    <div className='grid w-full max-w-[13rem] min-w-0 grid-cols-4 gap-1.5 sm:max-w-[15rem] md:max-w-[17rem]'>
      {team.slots.map((slot) => {
        const isOwned =
          !slot.awakenerName || (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) !== null
        return <TeamPreviewThumb isOwned={isOwned} key={slot.slotId} slot={slot} />
      })}
    </div>
  )
}

function TeamPosseBadge({team, isOwned}: {team: Team; isOwned: boolean}) {
  const posseAsset = team.posseId ? getPosseAssetById(team.posseId) : undefined

  return (
    <div className='flex w-11 shrink-0 flex-col items-center gap-1'>
      <span className='text-[8px] tracking-[0.12em] text-slate-500 uppercase'>Posse</span>
      <div className='flex h-10 w-10 items-center justify-center overflow-hidden border border-slate-500/45 bg-slate-950/60'>
        {posseAsset ? (
          <img
            alt={`${team.name} posse`}
            className={`h-full w-full object-cover ${isOwned ? '' : 'opacity-45 saturate-50'}`}
            draggable={false}
            src={posseAsset}
          />
        ) : (
          <span className='text-[10px] text-slate-600'>+</span>
        )}
      </div>
    </div>
  )
}

function TeamRowContent({
  team,
  isActive,
  deleteDisabled,
  ownedAwakenerLevelByName,
  ownedPosseLevelById,
  onEdit,
  onDelete,
  onBeginRename,
}: {
  team: Team
  isActive: boolean
  deleteDisabled: boolean
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedPosseLevelById: Map<string, number | null>
  onEdit: () => void
  onDelete: () => void
  onBeginRename: () => void
}) {
  const isPosseOwned = !team.posseId || (ownedPosseLevelById.get(team.posseId) ?? null) !== null

  return (
    <div
      className={`border px-3 py-3 transition-colors ${
        isActive
          ? 'border-amber-300/45 bg-slate-800/72 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_0_14px_rgba(251,191,36,0.16)]'
          : 'border-slate-600/45 bg-slate-900/55 hover:border-slate-500/55 hover:bg-slate-900/72'
      }`}
    >
      <div className='flex items-start gap-2'>
        <button className='min-w-0 flex-1 text-left' onClick={onEdit} type='button'>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate text-sm font-semibold text-slate-100'>{team.name}</span>
            {isActive ? (
              <span className='border border-amber-300/40 bg-amber-300/10 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-amber-200 uppercase'>
                Active
              </span>
            ) : null}
          </div>
          <div className='mt-2 flex items-end gap-2 [@media(orientation:landscape)]:items-center'>
            <TeamPreviewStrip ownedAwakenerLevelByName={ownedAwakenerLevelByName} team={team} />
            <TeamPosseBadge isOwned={isPosseOwned} team={team} />
          </div>
        </button>

        <div className='flex shrink-0 flex-col gap-1 self-stretch'>
          <button
            className='border border-slate-500/45 bg-slate-950/55 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-amber-300/40 hover:text-amber-100'
            onClick={onBeginRename}
            title='Rename team'
            type='button'
          >
            ✎
          </button>
          <button
            className='border border-slate-500/45 bg-slate-950/55 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-35'
            disabled={deleteDisabled}
            onClick={onDelete}
            title='Delete team'
            type='button'
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamRenameRow({
  draftValue,
  onDraftChange,
  onCommit,
  onCancel,
}: {
  draftValue: string
  onDraftChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}) {
  return (
    <div className='border border-amber-300/45 bg-slate-800/72 px-3 py-3'>
      <div className='flex items-center gap-2'>
        <input
          autoFocus
          className='min-w-0 flex-1 border-b border-amber-300/40 bg-transparent px-1 py-1 text-sm text-slate-100 outline-none'
          onChange={(event) => {
            onDraftChange(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onCommit()
            }
            if (event.key === 'Escape') {
              onCancel()
            }
          }}
          value={draftValue}
        />
        <button
          className='border border-emerald-300/40 bg-slate-950/45 px-2 py-1 text-[10px] text-emerald-200'
          onClick={onCommit}
          type='button'
        >
          Save
        </button>
        <button
          className='border border-slate-500/45 bg-slate-950/45 px-2 py-1 text-[10px] text-slate-300'
          onClick={onCancel}
          type='button'
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function BuilderTeamsPanel() {
  const [isManageOpen, setIsManageOpen] = useState(false)
  const teams = useBuilderStore(selectTeams)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const setActiveTeamId = useBuilderStore((state) => state.setActiveTeamId)
  const addTeam = useBuilderStore((state) => state.addTeam)
  const deleteTeam = useBuilderStore((state) => state.deleteTeam)
  const renameTeam = useBuilderStore((state) => state.renameTeam)
  const resetTeam = useBuilderStore((state) => state.resetTeam)
  const applyTemplate = useBuilderStore((state) => state.applyTemplate)
  const {ownedAwakenerLevelByName, ownedPosseLevelById} = useCollectionOwnership()

  const renameEditor = useInlineEditor({
    value: teams.find((team) => team.id === activeTeamId)?.name ?? '',
    onCommit: (nextName) => {
      if (renamingTeamId) {
        renameTeam(renamingTeamId, nextName)
      }
    },
    validate: (draft) => draft.trim() || 'Unnamed',
  })

  const renamingTeamId = renameEditor.isEditing ? activeTeamId : null

  const handleBeginRename = useCallback(
    (teamId: string) => {
      setActiveTeamId(teamId)
      const team = useBuilderStore.getState().teams.find((entry) => entry.id === teamId)
      if (team) {
        renameEditor.setDraft(team.name)
        renameEditor.beginEdit()
      }
    },
    [renameEditor, setActiveTeamId],
  )

  const handleDelete = useCallback(
    (teamId: string) => {
      deleteTeam(teamId)
    },
    [deleteTeam],
  )

  const handleEdit = useCallback(
    (teamId: string) => {
      setActiveTeamId(teamId)
    },
    [setActiveTeamId],
  )

  const handleResetActive = useCallback(() => {
    resetTeam(activeTeamId)
    setIsManageOpen(false)
  }, [activeTeamId, resetTeam])

  const handleApplyTemplate = useCallback(
    (templateId: TeamTemplateId) => {
      applyTemplate(templateId)
      setIsManageOpen(false)
    },
    [applyTemplate],
  )

  return (
    <div className='border border-slate-500/45 bg-slate-900/45 p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs tracking-[0.14em] text-slate-300 uppercase'>
            Teams ({teams.length}/{MAX_TEAMS})
          </p>
          <p className='mt-1 text-[11px] text-slate-500'>
            Reorder, rename, and switch teams from one compact list.
          </p>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          <div className='hidden items-center gap-2 md:flex'>
            <ToolbarButton label='Reset Active' onClick={handleResetActive} />
            {TEAM_TEMPLATE_OPTIONS.map((option) => (
              <ToolbarButton
                key={option.id}
                label={option.label}
                onClick={() => {
                  handleApplyTemplate(option.id)
                }}
              />
            ))}
          </div>
          <button
            aria-expanded={isManageOpen}
            className='border border-slate-500/45 bg-slate-950/55 px-2.5 py-1.5 text-[11px] text-slate-200 transition-colors hover:border-amber-300/45 md:hidden'
            onClick={() => {
              setIsManageOpen((current) => !current)
            }}
            type='button'
          >
            Manage
          </button>
          <ToolbarButton
            disabled={teams.length >= MAX_TEAMS}
            label='+ Add Team'
            onClick={addTeam}
          />
        </div>
      </div>

      {isManageOpen ? (
        <div className='mt-2 grid grid-cols-1 gap-2 md:hidden [@media(orientation:landscape)]:grid-cols-3'>
          <ToolbarButton label='Reset Active' onClick={handleResetActive} />
          {TEAM_TEMPLATE_OPTIONS.map((option) => (
            <ToolbarButton
              key={option.id}
              label={option.label}
              onClick={() => {
                handleApplyTemplate(option.id)
              }}
            />
          ))}
        </div>
      ) : null}

      <div className='mt-3'>
        <TeamsSortableList
          teams={teams}
          renderTeamRow={(team) => (
            <SortableTeamRow isActive={team.id === activeTeamId} key={team.id} teamId={team.id}>
              {renamingTeamId === team.id ? (
                <TeamRenameRow
                  draftValue={renameEditor.draftValue}
                  onCancel={renameEditor.cancel}
                  onCommit={renameEditor.commit}
                  onDraftChange={renameEditor.setDraft}
                />
              ) : (
                <TeamRowContent
                  deleteDisabled={teams.length <= 1}
                  isActive={team.id === activeTeamId}
                  onBeginRename={() => {
                    handleBeginRename(team.id)
                  }}
                  onDelete={() => {
                    handleDelete(team.id)
                  }}
                  onEdit={() => {
                    handleEdit(team.id)
                  }}
                  ownedAwakenerLevelByName={ownedAwakenerLevelByName}
                  ownedPosseLevelById={ownedPosseLevelById}
                  team={team}
                />
              )}
            </SortableTeamRow>
          )}
        />
      </div>
    </div>
  )
}
