import {memo} from 'react'

import type {
  BuilderV2TeamSummary,
  BuilderV2TeamSummarySlot,
} from './BuilderV2ModelTypes'
import type {TeamTemplateId} from '../builder/team-collection'

interface BuilderV2TeamManagementProps {
  canAddTeam: boolean
  editingTeamId: string | null
  editingTeamName: string
  maxTeams: number
  teams: BuilderV2TeamSummary[]
  variant?: 'desktop' | 'adaptive' | 'mobile'
  onTeamActivated?: () => void
  onAddTeam: () => void
  onBeginTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onCommitTeamRename: (teamId: string) => void
  onMoveTeamDown: (teamId: string) => void
  onMoveTeamUp: (teamId: string) => void
  onRequestApplyTeamTemplate: (templateId: TeamTemplateId) => void
  onRequestDeleteTeam: (teamId: string) => void
  onRequestResetTeam: (teamId: string) => void
  onSetActiveTeam: (teamId: string) => void
  onSetEditingTeamName: (nextName: string) => void
}

export const BuilderV2TeamManagement = memo(function BuilderV2TeamManagement({
  canAddTeam,
  editingTeamId,
  editingTeamName,
  maxTeams,
  teams,
  variant = 'desktop',
  onTeamActivated,
  onAddTeam,
  onBeginTeamRename,
  onCancelTeamRename,
  onCommitTeamRename,
  onMoveTeamDown,
  onMoveTeamUp,
  onRequestApplyTeamTemplate,
  onRequestDeleteTeam,
  onRequestResetTeam,
  onSetActiveTeam,
  onSetEditingTeamName,
}: BuilderV2TeamManagementProps) {
  return (
    <section
      aria-label='Builder V2 team management'
      className={`builder-v2-panel builder-v2-team-management builder-v2-team-management--${variant}`}
    >
      <div className='builder-v2-team-management-header'>
        <div className='builder-v2-team-management-identity'>
          <p className='builder-v2-label'>
            {variant === 'mobile' ? 'Other Teams' : 'Your Teams'}
          </p>
          <h2 className='ui-title'>
            {teams.length} / {maxTeams}
          </h2>
        </div>
        <div className='builder-v2-team-management-actions' aria-label='Team template actions'>
          <button
            className='builder-v2-team-management-button builder-v2-team-management-button--primary'
            disabled={!canAddTeam}
            onClick={() => {
              onAddTeam()
              onTeamActivated?.()
            }}
            type='button'
          >
            + Add Team
          </button>
          <button
            className='builder-v2-team-management-button'
            onClick={() => {
              onRequestApplyTeamTemplate('DTIDE_5')
            }}
            type='button'
          >
            Apply D-Tide 5
          </button>
          <button
            className='builder-v2-team-management-button'
            onClick={() => {
              onRequestApplyTeamTemplate('DTIDE_10')
            }}
            type='button'
          >
            Apply D-Tide 10
          </button>
        </div>
      </div>

      <div className='builder-v2-team-management-list'>
        {teams.map((team, index) => (
          <TeamManagementRow
            editingTeamId={editingTeamId}
            editingTeamName={editingTeamName}
            index={index}
            isLast={index === teams.length - 1}
            key={team.id}
            onTeamActivated={onTeamActivated}
            onBeginTeamRename={onBeginTeamRename}
            onCancelTeamRename={onCancelTeamRename}
            onCommitTeamRename={onCommitTeamRename}
            onMoveTeamDown={onMoveTeamDown}
            onMoveTeamUp={onMoveTeamUp}
            onRequestDeleteTeam={onRequestDeleteTeam}
            onRequestResetTeam={onRequestResetTeam}
            onSetActiveTeam={onSetActiveTeam}
            onSetEditingTeamName={onSetEditingTeamName}
            teamsCount={teams.length}
            team={team}
          />
        ))}
      </div>
    </section>
  )
})

const TeamManagementRow = memo(function TeamManagementRow({
  editingTeamId,
  editingTeamName,
  index,
  isLast,
  onTeamActivated,
  onBeginTeamRename,
  onCancelTeamRename,
  onCommitTeamRename,
  onMoveTeamDown,
  onMoveTeamUp,
  onRequestDeleteTeam,
  onRequestResetTeam,
  onSetActiveTeam,
  onSetEditingTeamName,
  teamsCount,
  team,
}: {
  editingTeamId: string | null
  editingTeamName: string
  index: number
  isLast: boolean
  onTeamActivated?: () => void
  onBeginTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onCommitTeamRename: (teamId: string) => void
  onMoveTeamDown: (teamId: string) => void
  onMoveTeamUp: (teamId: string) => void
  onRequestDeleteTeam: (teamId: string) => void
  onRequestResetTeam: (teamId: string) => void
  onSetActiveTeam: (teamId: string) => void
  onSetEditingTeamName: (nextName: string) => void
  teamsCount: number
  team: BuilderV2TeamSummary
}) {
  const isEditing = editingTeamId === team.id
  const teamIndex = String(index + 1).padStart(2, '0')

  return (
    <article
      className={`builder-v2-team-management-row ${
        team.isActive ? 'builder-v2-team-management-row--active' : ''
      }`}
      data-team-name={team.name}
    >
      {isEditing ? (
        <div className='builder-v2-team-management-select builder-v2-team-management-editing'>
          <span className='builder-v2-team-index'>{teamIndex}</span>
          <span className='builder-v2-team-management-copy'>
            <input
              aria-label='Team name'
              className='builder-v2-team-name-input'
              onBlur={() => {
                onCommitTeamRename(team.id)
              }}
              onChange={(event) => {
                onSetEditingTeamName(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onCommitTeamRename(team.id)
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onCancelTeamRename()
                }
              }}
              value={editingTeamName}
            />
          </span>
        </div>
      ) : (
        <button
          aria-label={`Select ${team.name}`}
          aria-pressed={team.isActive}
          className='builder-v2-team-management-select'
          onClick={() => {
            onSetActiveTeam(team.id)
            onTeamActivated?.()
          }}
          type='button'
        >
          <span className='builder-v2-team-index'>{teamIndex}</span>
          <span className='builder-v2-team-management-copy'>
            <span className='builder-v2-team-management-name'>{team.name}</span>
            <span className='builder-v2-team-management-meta'>
              {team.deployedCount} / 4 deployed
              {team.posseName ? ` - ${team.posseName}` : ' - No posse'}
            </span>
          </span>
        </button>
      )}

      <div className='builder-v2-team-management-slots'>
        {team.slots.map((slot) => (
          <TeamSlotSummary key={slot.slotId} slot={slot} />
        ))}
      </div>

      <div className='builder-v2-team-management-controls' aria-label={`${team.name} actions`}>
        <button
          aria-label={`Rename ${team.name}`}
          className='builder-v2-team-management-button'
          onClick={() => {
            onBeginTeamRename(team.id)
          }}
          type='button'
        >
          Rename
        </button>
        <button
          aria-label={`Move ${team.name} up`}
          className='builder-v2-team-management-button'
          disabled={index === 0}
          onClick={() => {
            onMoveTeamUp(team.id)
          }}
          type='button'
        >
          Move Up
        </button>
        <button
          aria-label={`Move ${team.name} down`}
          className='builder-v2-team-management-button'
          disabled={isLast}
          onClick={() => {
            onMoveTeamDown(team.id)
          }}
          type='button'
        >
          Move Down
        </button>
        <button
          aria-label={`Reset ${team.name}`}
          className='builder-v2-team-management-button'
          onClick={() => {
            onRequestResetTeam(team.id)
          }}
          type='button'
        >
          Reset
        </button>
        <button
          aria-label={`Delete ${team.name}`}
          className='builder-v2-team-management-button builder-v2-team-management-button--danger'
          disabled={teamsCount <= 1}
          onClick={() => {
            onRequestDeleteTeam(team.id)
          }}
          type='button'
        >
          Delete
        </button>
      </div>
    </article>
  )
})

function TeamSlotSummary({slot}: {slot: BuilderV2TeamSummarySlot}) {
  const compactLabel = slot.label.replace('Slot ', 'S')
  const wheelLabel =
    slot.wheelCount === 0
      ? null
      : `${String(slot.wheelCount)} ${slot.wheelCount === 1 ? 'wheel' : 'wheels'}`

  return (
    <div aria-label={slot.label} className='builder-v2-team-management-slot'>
      <span aria-hidden className='builder-v2-team-management-slot-art'>
        {slot.portraitSrc ? (
          <img alt='' draggable={false} src={slot.portraitSrc} />
        ) : (
          <span className='builder-v2-empty-mark'>+</span>
        )}
      </span>
      <span className='builder-v2-team-management-slot-copy'>
        <span className='builder-v2-label'>{compactLabel}</span>
        <span className='builder-v2-team-management-slot-name'>{slot.name}</span>
        <span className='builder-v2-team-management-tags'>
          {slot.isSupport ? <span>Support</span> : null}
          {wheelLabel ? <span>{wheelLabel}</span> : null}
          {slot.hasCovenant ? <span>Covenant</span> : null}
          {slot.isEmpty ? <span>Empty</span> : null}
        </span>
      </span>
    </div>
  )
}
