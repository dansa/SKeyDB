import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {BuilderDesktopLayout} from './BuilderDesktopLayout'

const {useStickyMaxHeight} = vi.hoisted(() => ({
  useStickyMaxHeight: vi.fn(),
}))

const {useMeasuredElementRect} = vi.hoisted(() => ({
  useMeasuredElementRect: vi.fn(),
}))

vi.mock('./useStickyMaxHeight', () => ({
  useStickyMaxHeight,
}))

vi.mock('./layout-hooks', () => ({
  useMeasuredElementRect,
}))

describe('BuilderDesktopLayout', () => {
  it('keeps the header above the builder and picker split while leaving teams under the builder', () => {
    useMeasuredElementRect.mockReturnValue({height: 612, ref: {current: null}, top: 120, width: 0})
    useStickyMaxHeight.mockReturnValue({maxHeight: 744, ref: {current: null}})

    render(
      <BuilderDesktopLayout
        picker={<div data-testid='desktop-picker'>Picker</div>}
        teamStage={<div data-testid='desktop-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='desktop-teams-panel'>Teams</div>}
        toolbar={<div data-testid='desktop-toolbar'>Toolbar</div>}
      />,
    )

    const layout = screen.getByTestId('builder-desktop-layout')
    const toolbarZone = screen.getByTestId('builder-desktop-toolbar-zone')
    const builderColumn = screen.getByTestId('builder-desktop-builder-column')
    const builderZone = screen.getByTestId('builder-desktop-builder-zone')
    const pickerRail = screen.getByTestId('builder-desktop-picker-rail')
    const teamStage = screen.getByTestId('desktop-team-stage')
    const teamsPanel = screen.getByTestId('desktop-teams-panel')

    expect(layout).toContainElement(screen.getByTestId('desktop-toolbar'))
    expect(toolbarZone).toContainElement(screen.getByTestId('desktop-toolbar'))
    expect(builderColumn).toContainElement(teamStage)
    expect(builderColumn).toContainElement(teamsPanel)
    expect(builderZone).toContainElement(teamStage)
    expect(pickerRail).toContainElement(screen.getByTestId('desktop-picker'))
    expect(
      screen.getByTestId('desktop-toolbar').compareDocumentPosition(builderZone) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(
      teamStage.compareDocumentPosition(teamsPanel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
  })

  it('couples the picker rail height to the builder zone while still capping it to the viewport', () => {
    useMeasuredElementRect.mockReturnValue({height: 612, ref: {current: null}, top: 120, width: 0})
    useStickyMaxHeight.mockReturnValue({maxHeight: 744, ref: {current: null}})

    render(
      <BuilderDesktopLayout
        picker={<div data-testid='desktop-picker'>Picker</div>}
        teamStage={<div data-testid='desktop-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='desktop-teams-panel'>Teams</div>}
        toolbar={<div data-testid='desktop-toolbar'>Toolbar</div>}
      />,
    )

    expect(screen.getByTestId('builder-desktop-picker-rail')).toHaveStyle({
      height: '744px',
      maxHeight: '744px',
      minHeight: '612px',
    })
    expect(screen.getByTestId('builder-desktop-picker-rail')).toHaveClass('overflow-hidden')
  })

  it('keeps desktop in a locked two-column layout instead of collapsing the picker below the builder', () => {
    useMeasuredElementRect.mockReturnValue({height: 612, ref: {current: null}, top: 120, width: 0})
    useStickyMaxHeight.mockReturnValue({maxHeight: 744, ref: {current: null}})

    render(
      <BuilderDesktopLayout
        picker={<div data-testid='desktop-picker'>Picker</div>}
        teamStage={<div data-testid='desktop-team-stage'>Stage</div>}
        teamsPanel={<div data-testid='desktop-teams-panel'>Teams</div>}
        toolbar={<div data-testid='desktop-toolbar'>Toolbar</div>}
      />,
    )

    expect(screen.getByTestId('builder-desktop-main-grid')).toHaveStyle({
      gridTemplateColumns: 'minmax(0, 1fr) minmax(22rem, 23rem)',
      minWidth: '54rem',
    })
  })
})
