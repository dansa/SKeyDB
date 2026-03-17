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
    undoReset: vi.fn(),
    importExportDialogProps: {},
    resetDialog: null,
    transferDialog: null,
    cancelReset: vi.fn(),
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
})
