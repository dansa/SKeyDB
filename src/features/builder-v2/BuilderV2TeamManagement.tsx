import type {
  BuilderV2Model,
  BuilderV2TeamSummary,
  BuilderV2TeamSummarySlot,
} from './useBuilderV2Model'

interface BuilderV2TeamManagementProps {
  model: BuilderV2Model
  variant?: 'desktop' | 'adaptive' | 'mobile'
  onTeamActivated?: () => void
}

export function BuilderV2TeamManagement({
  model,
  variant = 'desktop',
  onTeamActivated,
}: BuilderV2TeamManagementProps) {
  return (
    <section
      aria-label='Builder V2 team management'
      className={`builder-v2-panel builder-v2-team-management builder-v2-team-management--${variant}`}
    >
      <div className='builder-v2-team-management-header'>
        <div>
          <p className='builder-v2-label'>Your Teams</p>
          <h2 className='ui-title'>
            Teams {model.teams.length} / {model.maxTeams}
          </h2>
        </div>
        <div className='builder-v2-team-management-actions' aria-label='Team template actions'>
          <button
            className='builder-v2-team-management-button'
            disabled={!model.canAddTeam}
            onClick={() => {
              model.addTeam()
              onTeamActivated?.()
            }}
            type='button'
          >
            Add Team
          </button>
          <button
            className='builder-v2-team-management-button'
            onClick={() => {
              model.requestApplyTeamTemplate('DTIDE_5')
            }}
            type='button'
          >
            Apply D-Tide 5
          </button>
          <button
            className='builder-v2-team-management-button'
            onClick={() => {
              model.requestApplyTeamTemplate('DTIDE_10')
            }}
            type='button'
          >
            Apply D-Tide 10
          </button>
        </div>
      </div>

      <div className='builder-v2-team-management-list'>
        {model.teams.map((team, index) => (
          <TeamManagementRow
            index={index}
            isLast={index === model.teams.length - 1}
            key={team.id}
            model={model}
            onTeamActivated={onTeamActivated}
            team={team}
          />
        ))}
      </div>
    </section>
  )
}

function TeamManagementRow({
  index,
  isLast,
  model,
  onTeamActivated,
  team,
}: {
  index: number
  isLast: boolean
  model: BuilderV2Model
  onTeamActivated?: () => void
  team: BuilderV2TeamSummary
}) {
  const isEditing = model.editingTeamId === team.id
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
                model.commitTeamRename(team.id)
              }}
              onChange={(event) => {
                model.setEditingTeamName(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  model.commitTeamRename(team.id)
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  model.cancelTeamRename()
                }
              }}
              value={model.editingTeamName}
            />
          </span>
        </div>
      ) : (
        <button
          aria-label={`Select ${team.name}`}
          aria-pressed={team.isActive}
          className='builder-v2-team-management-select'
          onClick={() => {
            model.setActiveTeam(team.id)
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
            model.beginTeamRename(team.id)
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
            model.moveTeamUp(team.id)
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
            model.moveTeamDown(team.id)
          }}
          type='button'
        >
          Move Down
        </button>
        <button
          aria-label={`Reset ${team.name}`}
          className='builder-v2-team-management-button'
          onClick={() => {
            model.requestResetTeam(team.id)
          }}
          type='button'
        >
          Reset
        </button>
        <button
          aria-label={`Delete ${team.name}`}
          className='builder-v2-team-management-button builder-v2-team-management-button--danger'
          disabled={model.teams.length <= 1}
          onClick={() => {
            model.requestDeleteTeam(team.id)
          }}
          type='button'
        >
          Delete
        </button>
      </div>
    </article>
  )
}

function TeamSlotSummary({slot}: {slot: BuilderV2TeamSummarySlot}) {
  const compactLabel = slot.label.replace('Slot ', 'S')
  const wheelLabel =
    slot.wheelCount === 0
      ? null
      : `${String(slot.wheelCount)} ${slot.wheelCount === 1 ? 'wheel' : 'wheels'}`

  return (
    <div aria-label={slot.label} className='builder-v2-team-management-slot'>
      <span className='builder-v2-label'>{compactLabel}</span>
      <span className='builder-v2-team-management-slot-name'>{slot.name}</span>
      <span className='builder-v2-team-management-tags'>
        {slot.isSupport ? <span>Support</span> : null}
        {wheelLabel ? <span>{wheelLabel}</span> : null}
        {slot.hasCovenant ? <span>Covenant</span> : null}
        {slot.isEmpty ? <span>Empty</span> : null}
      </span>
    </div>
  )
}
