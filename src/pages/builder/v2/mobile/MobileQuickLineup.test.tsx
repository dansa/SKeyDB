import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import '../../../builder-page.integration-mocks'

import {BuilderPickerPanel} from '../BuilderPickerPanel'
import {useBuilderStore} from '../store/builder-store'
import {MobileLayout} from './MobileLayout'

const mockedMeasurement = {
  height: 0,
  ref: {current: null} as {current: HTMLDivElement | null},
  width: 0,
}

vi.mock('./layout-hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./layout-hooks')>()

  return {
    ...actual,
    useMeasuredElementSize: () => mockedMeasurement,
    useViewportSize: () => ({
      height: window.innerHeight,
      width: window.innerWidth,
    }),
  }
})

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedSlot1Awakener(awakenerName: 'agrippa' | 'casiah' = 'agrippa') {
  const state = useBuilderStore.getState()
  const nextSlots = state.teams[0].slots.map((slot, index) =>
    index === 0
      ? {
          ...slot,
          awakenerName,
          realm: awakenerName === 'agrippa' ? 'AEQUOR' : 'CARO',
          level: 60,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      : slot,
  )

  state.setActiveTeamSlots(nextSlots)
  state.clearSelection()
  state.setPickerTab('awakeners')
}

function renderMobileLayout() {
  const noop = () => undefined
  return render(
    <MobileLayout
      canUndoResetBuilder={false}
      onExportAll={noop}
      onExportIngame={noop}
      onImport={noop}
      onRequestResetBuilder={noop}
      onUndoResetBuilder={noop}
      renderPicker={({enableDragAndDrop, onItemSelected}) => (
        <BuilderPickerPanel
          enableDragAndDrop={enableDragAndDrop}
          hideTabs
          onItemSelected={onItemSelected}
        />
      )}
    />,
  )
}

function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  })
}

function setMeasuredSize(width: number, height: number) {
  mockedMeasurement.width = width
  mockedMeasurement.height = height
}

describe('MobileQuickLineup', () => {
  afterEach(() => {
    setMeasuredSize(0, 0)
    vi.unstubAllGlobals()
  })

  it('starts quick lineup from overview by clearing the active team and opening the quick-lineup shell', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    useBuilderStore.getState().setPosseForActiveTeam('posse-a')

    renderMobileLayout()
    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))

    expect(screen.getByTestId('mobile-quick-lineup-shell')).toBeInTheDocument()
    expect(screen.getByText(/Step 1 \/ 17/i)).toBeInTheDocument()
    expect(useBuilderStore.getState().quickLineupSessionState?.steps).toHaveLength(17)
    expect(useBuilderStore.getState().teams[0]?.posseId).toBeUndefined()
    expect(useBuilderStore.getState().teams[0]?.slots[0]?.awakenerName).toBeUndefined()
  })

  it('advances to wheel 1 after picking an awakener in quick lineup', async () => {
    resetStore()
    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /Agrippa portrait Agrippa/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().quickLineupSessionState?.currentStepIndex).toBe(1)
    })

    expect(useBuilderStore.getState().activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(screen.getByText(/Agrippa -> Wheel 1/i)).toBeInTheDocument()
  })

  it('lets slot targets jump the active step inside quick lineup', () => {
    resetStore()
    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))
    fireEvent.click(screen.getByTestId('quick-lineup-target-slot-2-covenant'))

    expect(useBuilderStore.getState().activeSelection).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(screen.getByText(/Slot 2 -> Awakener/i)).toBeInTheDocument()
  })

  it('dedupes repeated picker completion callbacks so one selection only advances one step', async () => {
    resetStore()
    const noop = () => undefined

    render(
      <MobileLayout
        canUndoResetBuilder={false}
        onExportAll={noop}
        onExportIngame={noop}
        onImport={noop}
        onRequestResetBuilder={noop}
        onUndoResetBuilder={noop}
        renderPicker={({
          onItemSelected,
        }: {
          enableDragAndDrop: boolean
          onItemSelected: () => void
        }) => (
          <button
            onClick={() => {
              const state = useBuilderStore.getState()
              const nextSlots = state.teams[0]?.slots.map((slot, index) =>
                index === 0
                  ? {
                      ...slot,
                      awakenerName: 'agrippa',
                      level: 60,
                      realm: 'AEQUOR',
                      wheels: [null, null] as [null, null],
                    }
                  : slot,
              )

              state.setActiveTeamSlots(nextSlots)

              onItemSelected()
              onItemSelected()
            }}
            type='button'
          >
            Advance twice
          </button>
        )}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /Advance twice/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().quickLineupSessionState?.currentStepIndex).toBe(1)
    })

    expect(useBuilderStore.getState().activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
  })

  it('cancels quick lineup by restoring the original team and returning to overview', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    useBuilderStore.getState().setPosseForActiveTeam('posse-a')

    renderMobileLayout()
    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /Cancel/i}))

    await waitFor(() => {
      expect(screen.getByTestId('mobile-overview-shell')).toBeInTheDocument()
    })

    expect(useBuilderStore.getState().teams[0]?.slots[0]?.awakenerName).toBe('agrippa')
    expect(useBuilderStore.getState().teams[0]?.posseId).toBe('posse-a')
  })

  it('keeps progress on finish and swaps layout modes with the viewport', async () => {
    resetStore()
    setViewportSize(390, 844)
    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /Agrippa portrait Agrippa/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0]?.slots[0]?.awakenerName).toBe('agrippa')
    })

    expect(screen.getByTestId('mobile-quick-lineup-shell')).toHaveAttribute(
      'data-layout-mode',
      'portrait',
    )

    fireEvent.click(screen.getByRole('button', {name: /Finish/i}))

    await waitFor(() => {
      expect(screen.getByTestId('mobile-overview-shell')).toBeInTheDocument()
    })

    expect(useBuilderStore.getState().teams[0]?.slots[0]?.awakenerName).toBe('agrippa')

    resetStore()
    setViewportSize(844, 390)
    renderMobileLayout()
    const [quickLineupButton] = screen.getAllByRole('button', {name: /Quick Lineup/i})
    fireEvent.click(quickLineupButton)

    expect(screen.getByTestId('mobile-quick-lineup-shell')).toHaveAttribute(
      'data-layout-mode',
      'landscape',
    )
    expect(screen.getByTestId('quick-lineup-landscape-rail')).toBeInTheDocument()
    expect(screen.getByTestId('quick-lineup-landscape-picker')).toBeInTheDocument()
    expect(screen.getByTestId('quick-lineup-landscape-picker-frame')).toBeInTheDocument()
  })

  it('keeps landscape mode stable even when the measured content box is portrait-shaped', () => {
    resetStore()
    setViewportSize(844, 390)
    setMeasuredSize(320, 700)

    renderMobileLayout()
    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))

    expect(screen.getByTestId('mobile-quick-lineup-shell')).toHaveAttribute(
      'data-layout-mode',
      'landscape',
    )
    expect(screen.getByTestId('quick-lineup-landscape-rail')).toBeInTheDocument()
    expect(screen.getByTestId('quick-lineup-landscape-picker')).toBeInTheDocument()
    expect(screen.getByTestId('quick-lineup-landscape-picker-frame')).toBeInTheDocument()
  })
})
