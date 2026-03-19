import type {ReactNode} from 'react'

import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {BuilderV2Page} from './BuilderV2Page'

const {useBuilderLayoutMode} = vi.hoisted(() => ({
  useBuilderLayoutMode: vi.fn(),
}))

const {useBuilderV2Actions} = vi.hoisted(() => ({
  useBuilderV2Actions: vi.fn(),
}))

const {builderConfirmDialogsMock} = vi.hoisted(() => ({
  builderConfirmDialogsMock: vi.fn(),
}))

vi.mock('./useBuilderLayoutMode', () => ({
  useBuilderLayoutMode,
}))

vi.mock('./useBuilderV2Actions', () => ({
  useBuilderV2Actions,
}))

vi.mock('./BuilderDndProvider', () => ({
  BuilderDndProvider: ({children}: {children: ReactNode}) => <>{children}</>,
}))

vi.mock('./mobile/MobileLayout', () => ({
  MobileLayout: ({shellMode, utilityBar}: {shellMode?: string; utilityBar?: ReactNode}) => (
    <div data-shell-mode={shellMode} data-testid='mobile-layout'>
      {utilityBar}
      <div>Mobile Layout</div>
    </div>
  ),
}))

vi.mock('./LayoutModeSwitcher', () => ({
  LayoutModeSwitcher: ({
    detectedMode,
    layoutOverride,
  }: {
    detectedMode: string
    layoutOverride: string
  }) => <div>{`Layout Switcher ${layoutOverride} ${detectedMode}`}</div>,
}))

vi.mock('../BuilderConfirmDialogs', () => ({
  BuilderConfirmDialogs: (props: unknown) => {
    builderConfirmDialogsMock(props)
    return null
  },
}))

vi.mock('../BuilderImportExportDialogs', () => ({
  BuilderImportExportDialogs: () => null,
}))

vi.mock('@/components/ui/Toast', () => ({
  Toast: () => null,
}))

function createActionsMock() {
  return {
    teams: [{id: 'team-1', name: 'Team 1', slots: []}],
    activeTeam: {id: 'team-1', name: 'Team 1', slots: []},
    canUndoReset: false,
    openExportAllDialog: vi.fn(),
    handleExportIngame: vi.fn(),
    openImportDialog: vi.fn(),
    requestReset: vi.fn(),
    requestResetTeam: vi.fn(),
    undoReset: vi.fn(),
    importExportDialogProps: {},
    resetDialog: null,
    resetTeamDialog: null,
    transferDialog: null,
    cancelReset: vi.fn(),
    cancelResetTeam: vi.fn(),
    cancelTransfer: vi.fn(),
    handlePickerAwakenerClick: vi.fn(() => true),
    handleDropPickerAwakener: vi.fn(),
    handlePickerWheelClick: vi.fn(() => true),
    handleDropPickerWheel: vi.fn(),
    handleDropTeamWheel: vi.fn(),
    handleDropTeamWheelToSlot: vi.fn(),
    handlePickerCovenantClick: vi.fn(() => true),
    handleDropPickerCovenant: vi.fn(),
    handleDropTeamCovenant: vi.fn(),
    handleDropTeamCovenantToSlot: vi.fn(),
    handleSetActivePosse: vi.fn(() => true),
    noop: vi.fn(),
    toastEntries: [],
  }
}

describe('BuilderV2Page', () => {
  beforeEach(() => {
    builderConfirmDialogsMock.mockReset()
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        disconnect() {
          return undefined
        }
        observe() {
          return undefined
        }
        unobserve() {
          return undefined
        }
      },
    )
  })

  it('keeps the layout switcher available when mobile mode is forced on desktop', () => {
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'mobile',
      layoutOverride: 'mobile',
      detectedMode: 'desktop',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue(createActionsMock())

    render(<BuilderV2Page />)

    expect(screen.getByText(/Layout Switcher mobile desktop/i)).toBeInTheDocument()
    expect(screen.getByTestId('mobile-layout')).toHaveAttribute('data-shell-mode', 'preview')
  })

  it('creates builder actions once and passes them through the desktop layout', () => {
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'desktop',
      layoutOverride: 'auto',
      detectedMode: 'desktop',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue(createActionsMock())

    render(<BuilderV2Page />)

    expect(useBuilderV2Actions.mock.calls.length).toBeLessThanOrEqual(2)
    expect(screen.getByRole('button', {name: /Import/i})).toBeInTheDocument()
  })

  it('keeps desktop export actions disabled when there are no teams or active team', () => {
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'desktop',
      layoutOverride: 'auto',
      detectedMode: 'desktop',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue({
      ...createActionsMock(),
      teams: [],
      activeTeam: null,
    })

    render(<BuilderV2Page />)

    expect(screen.getByRole('button', {name: /Export All/i})).toBeDisabled()
    expect(screen.getByRole('button', {name: /Export In-Game/i})).toBeDisabled()
  })

  it('applies the tablet width floor to the document instead of the inner tablet shell', () => {
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'tablet',
      layoutOverride: 'tablet',
      detectedMode: 'mobile',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue(createActionsMock())

    render(<BuilderV2Page />)

    expect(document.documentElement.style.minWidth).toBe('600px')
    expect(document.body.style.minWidth).toBe('600px')
    expect(screen.getByTestId('builder-tablet-layout')).not.toHaveStyle({minWidth: '600px'})
    expect(screen.getByTestId('builder-picker-panel')).toHaveAttribute(
      'data-layout-variant',
      'wide-sidebar',
    )
  })

  it('keeps tablet export actions disabled when there are no teams or active team', () => {
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'tablet',
      layoutOverride: 'tablet',
      detectedMode: 'tablet',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue({
      ...createActionsMock(),
      teams: [],
      activeTeam: null,
    })

    render(<BuilderV2Page />)

    expect(screen.getByRole('button', {name: /Export All/i})).toBeDisabled()
    expect(screen.getByRole('button', {name: /Export In-Game/i})).toBeDisabled()
  })

  it('passes the shared transfer dialog and cancel handler into confirm dialogs', () => {
    const transferDialog = {
      title: 'Move Agrippa',
      message: 'Agrippa is already used in Team 2. Move to Team 1?',
      onConfirm: vi.fn(),
    }
    const cancelTransfer = vi.fn()
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'mobile',
      layoutOverride: 'auto',
      detectedMode: 'mobile',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue({
      ...createActionsMock(),
      cancelTransfer,
      transferDialog,
    })

    render(<BuilderV2Page />)

    expect(builderConfirmDialogsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onCancelTransfer: cancelTransfer,
        transferDialog,
      }),
    )
  })

  it('passes the shared reset-team dialog and cancel handler into confirm dialogs', () => {
    const resetTeamDialog = {
      title: 'Reset Team 1',
      message: 'Reset Team 1? This clears assigned awakeners, wheels, covenant, and posse.',
      onConfirm: vi.fn(),
    }
    const cancelResetTeam = vi.fn()
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'tablet',
      layoutOverride: 'tablet',
      detectedMode: 'tablet',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue({
      ...createActionsMock(),
      cancelResetTeam,
      resetTeamDialog,
    })

    render(<BuilderV2Page />)

    expect(builderConfirmDialogsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onCancelResetTeam: cancelResetTeam,
        resetTeamDialog,
      }),
    )
  })

  it('keeps shared confirm dialog wiring on desktop layouts too', () => {
    const transferDialog = {
      title: 'Move Agrippa',
      message: 'Agrippa is already used in Team 2. Move to Team 1?',
      onConfirm: vi.fn(),
    }
    const cancelTransfer = vi.fn()
    useBuilderLayoutMode.mockReturnValue({
      layoutMode: 'desktop',
      layoutOverride: 'auto',
      detectedMode: 'desktop',
      setLayoutOverride: vi.fn(),
    })
    useBuilderV2Actions.mockReturnValue({
      ...createActionsMock(),
      cancelTransfer,
      transferDialog,
    })

    render(<BuilderV2Page />)

    expect(builderConfirmDialogsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onCancelTransfer: cancelTransfer,
        transferDialog,
      }),
    )
  })
})
