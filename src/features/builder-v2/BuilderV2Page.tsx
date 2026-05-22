import './builder-v2.css'

import {useEffect, useState} from 'react'

import {BuilderV2AwakenerPicker} from './BuilderV2AwakenerPicker'
import {BuilderV2MobileLayout} from './BuilderV2MobileLayout'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import {useBuilderV2Model} from './useBuilderV2Model'

const BUILDER_V2_MOBILE_BREAKPOINT_PX = 768

export function BuilderV2Page() {
  const model = useBuilderV2Model()
  const isMobile = useBuilderV2IsMobile()

  if (isMobile) {
    return <BuilderV2MobileLayout model={model} />
  }

  return (
    <section className='builder-v2-page' aria-labelledby='builder-v2-title'>
      <header className='builder-v2-page-header'>
        <div>
          <p className='builder-v2-label'>Local rebuild shell</p>
          <h1 className='ui-title' id='builder-v2-title'>
            Builder V2
          </h1>
        </div>
        <span className='builder-v2-status-pill'>Experimental</span>
      </header>

      <div className='builder-v2-shell'>
        <aside className='builder-v2-panel builder-v2-rail' aria-label='My teams'>
          <div className='builder-v2-section-header'>
            <div>
              <p className='builder-v2-label'>My Teams</p>
              <h2 className='ui-title'>{model.teams.length} Teams</h2>
            </div>
          </div>

          <div className='builder-v2-team-list'>
            {model.teams.map((team, index) => (
              <button
                aria-pressed={team.isActive}
                className={`builder-v2-team-row ${team.isActive ? 'builder-v2-team-row--active' : ''}`}
                key={team.id}
                onClick={() => {
                  model.setActiveTeam(team.id)
                }}
                type='button'
              >
                <span className='builder-v2-team-index'>{String(index + 1).padStart(2, '0')}</span>
                <span className='builder-v2-team-copy'>
                  <span className='builder-v2-team-name'>{team.name}</span>
                  <span className='builder-v2-team-meta'>
                    {String(team.deployedCount)} / 4 deployed
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className='builder-v2-workbench' aria-label='Active builder workspace'>
          <section className='builder-v2-panel builder-v2-active-team'>
            <div className='builder-v2-active-header'>
              <div>
                <p className='builder-v2-label'>Active Team</p>
                <h2 className='ui-title'>{model.activeTeamName}</h2>
              </div>
              <div className='builder-v2-posse-summary'>
                <button
                  aria-label='Select team posse'
                  aria-pressed={model.activeTeamTarget?.kind === 'posse'}
                  className={`builder-v2-posse-target ${
                    model.activeTeamTarget?.kind === 'posse'
                      ? 'builder-v2-posse-target--active'
                      : ''
                  }`}
                  onClick={model.selectPosse}
                  type='button'
                >
                  <span className='builder-v2-label'>Posse</span>
                  <span>{model.activePosse?.name ?? 'Not selected'}</span>
                </button>
                {model.activePosse ? (
                  <button
                    className='builder-v2-posse-clear'
                    onClick={model.clearPosse}
                    type='button'
                  >
                    Clear Posse
                  </button>
                ) : null}
              </div>
              <QuickLineupControls model={model} />
            </div>

            <BuilderV2TeamSlots
              onClearCovenant={model.clearCovenant}
              onClearWheel={model.clearWheel}
              onRemoveAwakener={model.removeAwakener}
              onSelectCovenantSlot={model.selectCovenantSlot}
              onSelectSlot={model.selectAwakenerSlot}
              onSelectWheelSlot={model.selectWheelSlot}
              quickLineupActive={Boolean(model.quickLineupSession)}
              slots={model.slots}
            />

            <p
              className='builder-v2-editing-line'
              role={model.violationMessage ? 'alert' : undefined}
            >
              {model.violationMessage ?? model.editingLabel}
            </p>
          </section>

          <section className='builder-v2-panel builder-v2-team-overview' aria-label='Team overview'>
            <div className='builder-v2-section-header'>
              <div>
                <p className='builder-v2-label'>Your Teams</p>
                <h2 className='ui-title'>Overview</h2>
              </div>
            </div>
            <div className='builder-v2-overview-strip'>
              {model.teams.map((team, index) => (
                <button
                  aria-pressed={team.isActive}
                  className={`builder-v2-overview-card ${team.isActive ? 'builder-v2-overview-card--active' : ''}`}
                  key={team.id}
                  onClick={() => {
                    model.setActiveTeam(team.id)
                  }}
                  type='button'
                >
                  <span className='builder-v2-team-index'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className='builder-v2-overview-name'>{team.name}</span>
                  <span className='builder-v2-overview-minis'>
                    {team.slotNames.map((slotName, slotIndex) => (
                      <span key={`${team.id}-${String(slotIndex)}`}>{slotName.slice(0, 2)}</span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <BuilderV2AwakenerPicker
          awakeners={model.awakeners}
          covenants={model.covenants}
          onAssignCovenant={model.assignCovenant}
          onAssignAwakener={model.assignAwakener}
          onAssignPosse={model.assignPosse}
          onAssignWheel={model.assignWheel}
          onPickerTabChange={model.setPickerTab}
          onSearchChange={model.setSearchQuery}
          pickerTab={model.pickerTab}
          posses={model.posses}
          searchQuery={model.searchQuery}
          wheels={model.wheels}
        />
      </div>
    </section>
  )
}

function useBuilderV2IsMobile() {
  const [isMobile, setIsMobile] = useState(() => getBuilderV2IsMobile())

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getBuilderV2IsMobile())
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}

function getBuilderV2IsMobile() {
  return window.innerWidth <= BUILDER_V2_MOBILE_BREAKPOINT_PX
}

type BuilderV2PageModel = ReturnType<typeof useBuilderV2Model>

function QuickLineupControls({model}: {model: BuilderV2PageModel}) {
  const session = model.quickLineupSession

  if (!session) {
    return (
      <button className='builder-v2-lineup-button' onClick={model.startQuickLineup} type='button'>
        Quick Team Lineup
      </button>
    )
  }

  return (
    <div className='builder-v2-lineup-controls' aria-label='Quick lineup controls'>
      <p className='builder-v2-lineup-step'>
        Step {String(session.currentStepIndex + 1)} / {String(session.totalSteps)}:{' '}
        {model.quickLineupStepLabel ?? 'Current step'}
      </p>
      <div className='builder-v2-lineup-actions'>
        <button
          className='builder-v2-lineup-action'
          disabled={!session.canGoBack}
          onClick={model.goBackQuickLineupStep}
          type='button'
        >
          Back
        </button>
        <button
          className='builder-v2-lineup-action'
          onClick={model.skipQuickLineupStep}
          type='button'
        >
          Next
        </button>
        <button
          aria-label='Cancel quick team lineup'
          className='builder-v2-lineup-action builder-v2-lineup-action--danger'
          onClick={model.cancelQuickLineup}
          type='button'
        >
          Cancel
        </button>
        <button
          aria-label='Finish quick team lineup'
          className='builder-v2-lineup-action builder-v2-lineup-action--success'
          onClick={model.finishQuickLineup}
          type='button'
        >
          Finish
        </button>
      </div>
    </div>
  )
}
