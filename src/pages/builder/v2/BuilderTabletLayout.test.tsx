import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {BuilderTabletLayout} from './BuilderTabletLayout'

const noop = () => undefined

describe('BuilderTabletLayout', () => {
  it('keeps the toolbar above the snapped main zone and the teams panel below it', () => {
    render(
      <BuilderTabletLayout
        picker={<div data-testid='tablet-picker'>Picker</div>}
        teamStage={<div data-testid='tablet-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='tablet-teams-panel'>Teams</div>}
        toolbar={<div data-testid='tablet-toolbar'>Toolbar</div>}
      />,
    )

    const layout = screen.getByTestId('builder-tablet-layout')
    const toolbar = screen.getByTestId('tablet-toolbar')
    const toolbarShell = screen.getByTestId('builder-toolbar-shell')
    const shell = screen.getByTestId('builder-tablet-shell')
    const mainZone = screen.getByTestId('builder-tablet-main-zone')
    const pickerShell = screen.getByTestId('builder-tablet-picker-shell')
    const teamStage = screen.getByTestId('tablet-team-stage')
    const teamsPanel = screen.getByTestId('tablet-teams-panel')

    expect(layout).toContainElement(toolbar)
    expect(shell).toContainElement(toolbarShell)
    expect(toolbarShell).toContainElement(toolbar)
    expect(mainZone).toContainElement(screen.getByTestId('tablet-picker'))
    expect(mainZone).toContainElement(teamStage)
    expect(pickerShell).toContainElement(screen.getByTestId('tablet-picker'))
    expect(teamsPanel.closest('[data-mobile-builder-exit-zone="true"]')).not.toBeNull()
    expect(toolbar.compareDocumentPosition(mainZone) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(
      teamStage.compareDocumentPosition(teamsPanel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
  })

  it('marks the tablet main zone as the single snapped zone and keeps the exit zone separate', () => {
    render(
      <BuilderTabletLayout
        picker={<div data-testid='tablet-picker'>Picker</div>}
        teamStage={<div data-testid='tablet-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='tablet-teams-panel'>Teams</div>}
        toolbar={<div data-testid='tablet-toolbar'>Toolbar</div>}
      />,
    )

    expect(screen.getByTestId('builder-tablet-main-zone')).toHaveAttribute(
      'data-mobile-builder-snap-target',
      'true',
    )
    expect(screen.getByTestId('builder-tablet-shell')).not.toHaveAttribute(
      'data-mobile-builder-snap-target',
    )
    expect(screen.getByTestId('builder-toolbar-shell')).not.toHaveAttribute(
      'data-mobile-builder-snap-target',
    )
    expect(
      screen.getByTestId('tablet-teams-panel').closest('[data-mobile-builder-exit-zone="true"]'),
    ).not.toBeNull()
  })

  it('does not own the tablet page-level minimum width itself', () => {
    render(
      <BuilderTabletLayout
        picker={<div data-testid='tablet-picker'>Picker</div>}
        teamStage={<div data-testid='tablet-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='tablet-teams-panel'>Teams</div>}
        toolbar={<div data-testid='tablet-toolbar'>Toolbar</div>}
      />,
    )

    expect(screen.getByTestId('builder-tablet-layout')).not.toHaveStyle({minWidth: '600px'})
  })

  it('keeps the snapped tablet main zone locked to the shared 600px floor on short viewports', () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 420,
      writable: true,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 420,
        width: 900,
        addEventListener: noop,
        removeEventListener: noop,
      },
      writable: true,
    })

    render(
      <BuilderTabletLayout
        picker={<div data-testid='tablet-picker'>Picker</div>}
        teamStage={<div data-testid='tablet-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='tablet-teams-panel'>Teams</div>}
        toolbar={<div data-testid='tablet-toolbar'>Toolbar</div>}
      />,
    )

    const mainZone = screen.getByTestId('builder-tablet-main-zone')
    const pickerShell = screen.getByTestId('builder-tablet-picker-shell')
    const stageShell = screen.getByTestId('tablet-team-stage').parentElement

    expect(mainZone).toHaveStyle({minHeight: '600px'})
    expect(pickerShell.style.height).not.toBe('')
    expect(pickerShell.style.minHeight).toBe('')
    expect(stageShell?.style.height).not.toBe('')
  })
})
