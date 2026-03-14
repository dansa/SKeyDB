import type {ReactNode} from 'react'

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {BuilderV2Page} from './BuilderV2Page'

const {useBuilderLayoutMode} = vi.hoisted(() => ({
  useBuilderLayoutMode: vi.fn(),
}))

const {useBuilderV2Actions} = vi.hoisted(() => ({
  useBuilderV2Actions: vi.fn(),
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
  BuilderConfirmDialogs: () => null,
}))

vi.mock('../BuilderImportExportDialogs', () => ({
  BuilderImportExportDialogs: () => null,
}))

vi.mock('@/components/ui/Toast', () => ({
  Toast: () => null,
}))

function createActionsMock() {
  return {
    canUndoReset: false,
    openExportAllDialog: vi.fn(),
    handleExportIngame: vi.fn(),
    openImportDialog: vi.fn(),
    requestReset: vi.fn(),
    undoReset: vi.fn(),
    importExportDialogProps: {},
    resetDialog: null,
    cancelReset: vi.fn(),
    noop: vi.fn(),
    toastEntries: [],
  }
}

describe('BuilderV2Page', () => {
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
})
