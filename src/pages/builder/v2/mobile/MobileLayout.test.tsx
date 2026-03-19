import {StrictMode, type ComponentProps} from 'react'

import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {renderToStaticMarkup} from 'react-dom/server'
import {afterEach, describe, expect, it, vi} from 'vitest'

import '../../../builder-page.integration-mocks'

import {BuilderPickerPanel} from '../BuilderPickerPanel'
import {useBuilderStore} from '../store/builder-store'
import {useBuilderV2Actions} from '../useBuilderV2Actions'
import {MobileLayout} from './MobileLayout'
import {MobileQuickLineup} from './MobileQuickLineup'

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

function seedSupportSlot1Awakener() {
  const state = useBuilderStore.getState()
  const nextSlots = state.teams[0].slots.map((slot, index) =>
    index === 0
      ? {
          ...slot,
          awakenerName: 'agrippa',
          isSupport: true,
          realm: 'AEQUOR',
          level: 90,
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
      onRequestResetTeam={noop}
      onUndoResetBuilder={noop}
      renderPicker={({enableDragAndDrop, onItemSelected}) => (
        <TestPickerPanel
          enableDragAndDrop={enableDragAndDrop}
          hideTabs
          onItemSelected={onItemSelected}
        />
      )}
    />,
  )
}

function TestPickerPanel(props: Omit<ComponentProps<typeof BuilderPickerPanel>, 'actions'>) {
  const actions = useBuilderV2Actions()
  return <BuilderPickerPanel actions={actions} {...props} />
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

describe('MobileLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('enables page-level snap for the device shell and removes it on unmount', async () => {
    resetStore()

    const view = renderMobileLayout()

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-mobile-builder-snap', 'enabled')
      expect(document.body).toHaveAttribute('data-mobile-builder-snap', 'enabled')
    })

    expect(screen.getByTestId('mobile-overview-shell')).toHaveAttribute(
      'data-mobile-builder-snap-target',
      'true',
    )
    expect(screen.getByTestId('mobile-builder-zone')).not.toHaveAttribute(
      'data-mobile-builder-snap-target',
    )
    expect(screen.getByTestId('builder-toolbar-shell')).not.toHaveAttribute(
      'data-mobile-builder-snap-target',
    )
    expect(screen.getByTestId('mobile-builder-teams-section')).toHaveAttribute(
      'data-mobile-builder-exit-zone',
      'true',
    )

    view.unmount()

    await waitFor(() => {
      expect(document.documentElement).not.toHaveAttribute('data-mobile-builder-snap')
      expect(document.body).not.toHaveAttribute('data-mobile-builder-snap')
    })
  })

  it('keeps page-level snap enabled for preview shells too', async () => {
    resetStore()

    const noop = () => undefined
    render(
      <MobileLayout
        canUndoResetBuilder={false}
        onExportAll={noop}
        onExportIngame={noop}
        onImport={noop}
        onRequestResetBuilder={noop}
        onRequestResetTeam={noop}
        onUndoResetBuilder={noop}
        renderPicker={({
          enableDragAndDrop,
          onItemSelected,
        }: {
          enableDragAndDrop: boolean
          onItemSelected: () => void
        }) => (
          <TestPickerPanel
            enableDragAndDrop={enableDragAndDrop}
            hideTabs
            onItemSelected={onItemSelected}
          />
        )}
        shellMode='preview'
      />,
    )

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-mobile-builder-snap', 'enabled')
      expect(document.body).toHaveAttribute('data-mobile-builder-snap', 'enabled')
    })
  })

  it('keeps view swaps inside the builder zone without forcing a second page recenter', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    const scrollCalls: {element: HTMLElement; options: ScrollIntoViewOptions | undefined}[] = []
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: function scrollIntoView(options?: ScrollIntoViewOptions) {
        scrollCalls.push({element: this as HTMLElement, options})
      },
    })

    renderMobileLayout()

    expect(scrollCalls).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    await waitFor(() => {
      expect(screen.getByTestId('mobile-focused-shell')).toBeInTheDocument()
    })

    expect(scrollCalls).toHaveLength(0)

    scrollCalls.length = 0

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))

    await waitFor(() => {
      expect(screen.getByTestId('mobile-quick-lineup-shell')).toBeInTheDocument()
    })

    expect(scrollCalls).toHaveLength(0)
  })

  it('does not recenter the builder zone on initial mount under StrictMode', () => {
    resetStore()

    const scrollCalls: {element: HTMLElement; options: ScrollIntoViewOptions | undefined}[] = []
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: function scrollIntoView(options?: ScrollIntoViewOptions) {
        scrollCalls.push({element: this as HTMLElement, options})
      },
    })

    render(
      <StrictMode>
        <MobileLayout
          canUndoResetBuilder={false}
          onExportAll={() => undefined}
          onExportIngame={() => undefined}
          onImport={() => undefined}
          onRequestResetBuilder={() => undefined}
          onRequestResetTeam={() => undefined}
          onUndoResetBuilder={() => undefined}
          renderPicker={({enableDragAndDrop, onItemSelected}) => (
            <TestPickerPanel
              enableDragAndDrop={enableDragAndDrop}
              hideTabs
              onItemSelected={onItemSelected}
            />
          )}
        />
      </StrictMode>,
    )

    expect(scrollCalls).toHaveLength(0)
  })

  it('snaps the teams section back to its top edge instead of its bottom edge', () => {
    resetStore()
    setViewportSize(390, 844)
    vi.useFakeTimers()

    try {
      const scrollingElement = document.documentElement
      Object.defineProperty(document, 'scrollingElement', {
        configurable: true,
        value: scrollingElement,
      })
      scrollingElement.scrollTop = 1030

      const scrollCalls: {element: HTMLElement; options: ScrollIntoViewOptions | undefined}[] = []
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: function scrollIntoView(options?: ScrollIntoViewOptions) {
          scrollCalls.push({element: this as HTMLElement, options})
        },
      })

      renderMobileLayout()

      const builderShell = screen.getByTestId('mobile-overview-shell')
      const exitZone = screen.getByTestId('mobile-builder-teams-section')

      Object.defineProperty(builderShell, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          bottom: -58,
          height: 900,
          left: 0,
          right: 390,
          toJSON: () => ({}),
          top: -958,
          width: 390,
          x: 0,
          y: -958,
        }),
      })
      Object.defineProperty(exitZone, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          bottom: 142,
          height: 120,
          left: 0,
          right: 390,
          toJSON: () => ({}),
          top: 22,
          width: 390,
          x: 0,
          y: 22,
        }),
      })

      act(() => {
        vi.advanceTimersByTime(241)
      })

      scrollingElement.scrollTop = 1080
      fireEvent.scroll(window)
      act(() => {
        vi.advanceTimersByTime(121)
      })

      expect(scrollCalls).toHaveLength(1)
      expect(scrollCalls[0]?.element).toBe(exitZone)
      expect(scrollCalls[0]?.options).toMatchObject({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores load-time scroll events until page snap arms, then still snaps later user scrolls', () => {
    resetStore()
    setViewportSize(390, 844)
    vi.useFakeTimers()

    try {
      const scrollingElement = document.documentElement
      Object.defineProperty(document, 'scrollingElement', {
        configurable: true,
        value: scrollingElement,
      })
      scrollingElement.scrollTop = 1030

      const scrollCalls: {element: HTMLElement; options: ScrollIntoViewOptions | undefined}[] = []
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: function scrollIntoView(options?: ScrollIntoViewOptions) {
          scrollCalls.push({element: this as HTMLElement, options})
        },
      })

      renderMobileLayout()

      const builderShell = screen.getByTestId('mobile-overview-shell')
      const exitZone = screen.getByTestId('mobile-builder-teams-section')

      Object.defineProperty(builderShell, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          bottom: -58,
          height: 900,
          left: 0,
          right: 390,
          toJSON: () => ({}),
          top: -958,
          width: 390,
          x: 0,
          y: -958,
        }),
      })
      Object.defineProperty(exitZone, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          bottom: 142,
          height: 120,
          left: 0,
          right: 390,
          toJSON: () => ({}),
          top: 22,
          width: 390,
          x: 0,
          y: 22,
        }),
      })

      scrollingElement.scrollTop = 1080
      fireEvent.scroll(window)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(scrollCalls).toHaveLength(0)

      scrollingElement.scrollTop = 1090
      fireEvent.scroll(window)
      act(() => {
        vi.advanceTimersByTime(121)
      })

      expect(scrollCalls).toHaveLength(1)
      expect(scrollCalls[0]?.element).toBe(exitZone)
    } finally {
      vi.useRealTimers()
    }
  })

  it('replaces the focused awakener and closes the picker drawer', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))
    fireEvent.click(screen.getByRole('button', {name: /Agrippa card/i}))

    expect(screen.getByText(/Slot 1 — Change Awakener/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /Casiah portrait Casiah/i}))

    await waitFor(() => {
      const [slot1, slot2] = useBuilderStore.getState().teams[0].slots
      expect(slot1.awakenerName).toBe('casiah')
      expect(slot2.awakenerName).toBeUndefined()
    })

    await waitFor(() => {
      expect(screen.queryByText(/Slot 1 — Change Awakener/i)).not.toBeInTheDocument()
    })

    expect(screen.getByRole('button', {name: /Quick Lineup/i})).toBeInTheDocument()
  })

  it('disables picker drag and drop inside the mobile builder drawer', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    const {container} = renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))
    fireEvent.click(screen.getByRole('button', {name: /Agrippa card/i}))

    await waitFor(() => {
      expect(screen.getByText(/Slot 1 — Change Awakener/i)).toBeInTheDocument()
    })

    expect(container.querySelector("[data-picker-kind='awakener']")).toHaveAttribute(
      'data-picker-draggable',
      'false',
    )
  })

  it('gives the picker scrim an accessible close name when the drawer is open', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))
    fireEvent.click(screen.getByRole('button', {name: /Agrippa card/i}))

    await waitFor(() => {
      expect(screen.getByText(/Slot 1 — Change Awakener/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', {name: /Close picker/i})).toBeInTheDocument()
  })

  it('resolves the picker drawer slot title from picker context instead of local return state', async () => {
    resetStore()
    const state = useBuilderStore.getState()
    state.setActiveTeamSlots(
      state.teams[0].slots.map((slot, index) =>
        index === 1
          ? {
              ...slot,
              awakenerName: 'casiah',
              realm: 'CARO',
              level: 60,
              wheels: [null, null] as [null, null],
              covenantId: undefined,
            }
          : slot,
      ),
    )

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Casiah card Casiah/i}))
    fireEvent.click(screen.getByRole('button', {name: /Casiah card/i}))

    await waitFor(() => {
      expect(screen.getByText(/Slot 2 — Change Awakener/i)).toBeInTheDocument()
    })
  })

  it('anchors the picker drawer to the builder content frame instead of the utility toolbar shell', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    const noop = () => undefined
    render(
      <MobileLayout
        canUndoResetBuilder={false}
        onExportAll={noop}
        onExportIngame={noop}
        onImport={noop}
        onRequestResetBuilder={noop}
        onRequestResetTeam={noop}
        onUndoResetBuilder={noop}
        renderPicker={({enableDragAndDrop, onItemSelected}) => (
          <TestPickerPanel
            enableDragAndDrop={enableDragAndDrop}
            hideTabs
            onItemSelected={onItemSelected}
          />
        )}
        utilityBar={<div>Layout Override</div>}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))
    fireEvent.click(screen.getByRole('button', {name: /Agrippa card/i}))

    await waitFor(() => {
      expect(screen.getByText(/Slot 1 — Change Awakener/i)).toBeInTheDocument()
    })

    expect(screen.getByTestId('mobile-builder-content-frame')).toContainElement(
      screen.getByText(/Slot 1 — Change Awakener/i),
    )
    expect(screen.getByTestId('builder-toolbar-shell')).toHaveTextContent(/Layout Override/i)
    expect(screen.getByTestId('builder-toolbar-shell')).not.toContainElement(
      screen.getByText(/Slot 1 — Change Awakener/i),
    )
  })

  it('fills the focused wheel slot and closes the picker drawer', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))
    const wheelButtons = screen.getByTestId('mobile-focused-loadout-row').querySelectorAll('button')
    expect(wheelButtons[0]).toBeDefined()
    fireEvent.click(wheelButtons[0])

    expect(screen.getByText(/Slot 1 — Wheel 1/i)).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: /Merciful Nurturing wheel Merciful Nurturing/i,
      }),
    )

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0].slots[0].wheels[0]).toBe('O01')
    })

    await waitFor(() => {
      expect(screen.queryByText(/Slot 1 — Wheel 1/i)).not.toBeInTheDocument()
    })
  })

  it('clears the focused awakener slot without relying on drag and drop', async () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))
    fireEvent.click(screen.getByRole('button', {name: /Clear Slot/i}))

    await waitFor(() => {
      const [slot1] = useBuilderStore.getState().teams[0].slots
      expect(slot1.awakenerName).toBeUndefined()
      expect(slot1.wheels).toEqual([null, null])
      expect(slot1.covenantId).toBeUndefined()
    })

    expect(screen.getByText(/Deploy Awakener/i)).toBeInTheDocument()
  })

  it('shows support state in focused mobile view and preserves support max enlighten display', async () => {
    resetStore()
    seedSupportSlot1Awakener()

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    await waitFor(() => {
      expect(screen.getByTestId('mobile-focused-shell')).toBeInTheDocument()
    })

    expect(screen.getByText(/^Support Awakener$/i)).toBeInTheDocument()
    expect(screen.getByText(/Lv\. 90, Support Awakener, Enlighten 15/i)).toBeInTheDocument()
  })

  it('opens an empty overview slot without crashing', () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    renderMobileLayout()

    fireEvent.click(screen.getAllByRole('button', {name: /Deploy/i})[0])

    expect(screen.getByTestId('mobile-focused-shell')).toBeInTheDocument()
    expect(screen.getByText(/Deploy Awakener/i)).toBeInTheDocument()
  })

  it('does not render the legacy stacked loadout drawer in portrait focused mode', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(390, 844)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.queryByTestId('mobile-focused-stacked-loadout')).toBeNull()
    expect(screen.getByTestId('mobile-focused-loadout-row')).toBeInTheDocument()
  })

  it('renders the tall wide focused layout as a single stacked stage before side rails kick in', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(900, 520)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-stage')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-focused-stage')).toHaveAttribute('data-stage', 'stacked')
    expect(screen.getByTestId('mobile-focused-loadout-row')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-focused-stacked-loadout')).toBeNull()
    expect(screen.getByTestId('mobile-focused-posse-rail')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-focused-stage')).toHaveTextContent(/Lv\.?\s*60/i)
    expect(screen.getByTestId('mobile-focused-stage')).toHaveTextContent(/Not Set/i)
  })

  it('moves both side groups into the three-column split stage once the stacked layout runs out of height', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(900, 390)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-stage')).toHaveAttribute('data-stage', 'split')
  })

  it('keeps the posse control visible above the slot rail in the split stage', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(900, 430)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-posse-rail')).toHaveTextContent(/Not Set/i)
  })

  it('keeps wide landscape mode active and moves the loadout into a right-hand stack on short viewports', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(720, 350)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-stage')).toHaveAttribute('data-stage', 'split')
  })

  it('uses the wide focused stage on large square viewports instead of falling back to stacked drawers', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(1200, 1200)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-stage')).toHaveAttribute('data-stage', 'stacked')
    expect(screen.queryByTestId('mobile-focused-stacked-loadout')).toBeNull()
  })

  it('lets the final split stage scroll once the focused art hits its 240px floor', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(720, 220)

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-shell').textContent).toContain('Quick Lineup')
    expect(screen.getByTestId('mobile-focused-stage')).toHaveAttribute('data-stage', 'split')
    expect(screen.getByTestId('mobile-focused-shell').querySelector('.overflow-y-auto')).toBeNull()
  })

  it('keeps focused mode on the same viewport-height shell as overview', () => {
    resetStore()
    seedSlot1Awakener('agrippa')

    renderMobileLayout()

    fireEvent.click(screen.getByRole('button', {name: /Agrippa card Agrippa/i}))

    expect(screen.getByTestId('mobile-focused-shell')).toHaveClass('h-[100svh]')
    expect(screen.getByTestId('mobile-focused-shell')).toHaveClass('min-h-[100svh]')
  })

  it('stretches overview cards to the remaining builder height', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(390, 760)
    const state = useBuilderStore.getState()
    state.setActiveTeamSlots(
      state.teams[0].slots.map((slot, index) =>
        index === 0 ? {...slot, wheels: ['O01', null] as ['O01', null]} : slot,
      ),
    )

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('h-[100svh]')
    expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('min-h-[100svh]')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveClass('h-full')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveAttribute('data-columns', '2')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveAttribute('data-rows', '2')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveStyle({
      gridTemplateRows: 'repeat(2, 368px)',
    })
    expect(screen.getByTestId('mobile-overview-meta-strip')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Agrippa card Agrippa/i})).toHaveStyle({
      height: '368px',
      width: '183px',
    })
    expect(screen.getByTestId('mobile-overview-wheel-0-filled')).toHaveClass('aspect-[1/2]')
    expect(screen.getByTestId('mobile-overview-wheel-1-empty')).toHaveClass('aspect-[1/2]')
    expect(screen.getByTestId('mobile-overview-covenant-empty')).toHaveClass('aspect-square')
    for (const button of screen.getAllByRole('button', {name: /Deploy/i})) {
      expect(button).toHaveStyle({height: '368px', width: '183px'})
    }
  })

  it('uses a four-by-one overview grid on landscape viewports with the same shared card sizing rules', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(900, 390)

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-grid')).toHaveAttribute('data-columns', '4')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveAttribute('data-rows', '1')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveStyle({
      gridTemplateRows: 'repeat(1, 374px)',
    })
    expect(screen.getByRole('button', {name: /Agrippa card Agrippa/i})).toHaveStyle({
      height: '374px',
      width: '215px',
    })
  })

  it('keeps mid-height portrait overview cards fluid before the shared 240px floor kicks in', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(425, 650)

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-grid')).toHaveStyle({
      gridTemplateRows: 'repeat(2, 313px)',
    })
    expect(screen.getByRole('button', {name: /Agrippa card Agrippa/i})).toHaveStyle({
      height: '313px',
      width: '200.5px',
    })
  })

  it('keeps shrinking overview cards on short shells instead of hitting the old 240px floor', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(390, 420)

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-grid')).toHaveStyle({
      gridTemplateRows: 'repeat(2, 198px)',
    })
    expect(screen.getByRole('button', {name: /Agrippa card Agrippa/i})).toHaveStyle({
      height: '198px',
      width: '183px',
    })
    expect(screen.getByTestId('mobile-overview-grid')).not.toHaveClass('overflow-y-auto')
  })

  it('falls back to a single-row tab strip on short landscape shells so the overview keeps its vertical room', () => {
    resetStore()
    setViewportSize(700, 300)
    useBuilderStore.getState().applyTemplate('DTIDE_10')

    renderMobileLayout()

    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-compact-layout',
      'single-row-flex',
    )
  })

  it('keeps the compact tabs on one row up through roughly 400px-tall landscape shells', () => {
    resetStore()
    setViewportSize(700, 400)
    useBuilderStore.getState().applyTemplate('DTIDE_10')

    renderMobileLayout()

    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-compact-layout',
      'single-row-flex',
    )
  })

  it('keeps overview on a fixed-height shell in normal cases so the grid can keep scaling within the viewport', () => {
    resetStore()
    setViewportSize(700, 300)
    useBuilderStore.getState().applyTemplate('DTIDE_10')

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('h-[100svh]')
    expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('min-h-[100svh]')
  })

  it('switches overview to a growable shell on very short landscapes using the measured chrome height, without relying on grid feedback', async () => {
    resetStore()
    setViewportSize(700, 220)
    useBuilderStore.getState().applyTemplate('DTIDE_10')

    const originalGetBoundingClientRectDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'getBoundingClientRect',
    )
    const callOriginalGetBoundingClientRect = (element: HTMLElement) => {
      const originalGetBoundingClientRect = originalGetBoundingClientRectDescriptor?.value as
        | ((this: HTMLElement) => DOMRect)
        | undefined

      return originalGetBoundingClientRect
        ? originalGetBoundingClientRect.call(element)
        : DOMRect.fromRect({height: 0, width: 0, x: 0, y: 0})
    }
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function getBoundingClientRect(this: HTMLElement) {
        const testId = this.getAttribute('data-testid')

        if (testId === 'mobile-overview-chrome') {
          return DOMRect.fromRect({height: 118, width: 700, x: 0, y: 0})
        }

        return callOriginalGetBoundingClientRect(this)
      },
    })

    try {
      renderMobileLayout()

      await waitFor(() => {
        expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('min-h-[100svh]')
        expect(screen.getByTestId('mobile-overview-shell')).not.toHaveClass('h-[100svh]')
      })

      expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
        'data-compact-layout',
        'single-row-flex',
      )
    } finally {
      if (originalGetBoundingClientRectDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          'getBoundingClientRect',
          originalGetBoundingClientRectDescriptor,
        )
      }
    }
  })

  it('prefers the shared four-by-one overview layout on roomy square viewports too', () => {
    resetStore()
    seedSlot1Awakener('agrippa')
    setViewportSize(760, 760)

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-grid')).toHaveAttribute('data-columns', '4')
    expect(screen.getByTestId('mobile-overview-grid')).toHaveAttribute('data-rows', '1')
    expect(screen.getByRole('button', {name: /Agrippa card Agrippa/i})).toHaveStyle({
      height: '450px',
      width: '180px',
    })
  })

  it('renders a teams management section below the main mobile builder shell', () => {
    resetStore()

    renderMobileLayout()

    expect(screen.getByTestId('mobile-overview-shell')).not.toContainElement(
      screen.getByRole('button', {name: /Import/i}),
    )
    expect(screen.getByRole('button', {name: /Import/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Export All/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Reset Team/i})).toBeInTheDocument()
    expect(screen.getByTitle(/Team 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /^\+$/})).toBeInTheDocument()
  })

  it('keeps the shared toolbar export-in-game guard on mobile when no active team is available', () => {
    resetStore()
    useBuilderStore.setState({activeTeamId: 'missing-team'})

    renderMobileLayout()

    expect(screen.getByRole('button', {name: /Export In-Game/i})).toBeDisabled()
  })

  it('renders a utility bar and preview shell when mobile mode is forced on a wide viewport', () => {
    resetStore()

    const noop = () => undefined
    render(
      <MobileLayout
        canUndoResetBuilder={false}
        onExportAll={noop}
        onExportIngame={noop}
        onImport={noop}
        onRequestResetBuilder={noop}
        onRequestResetTeam={noop}
        onUndoResetBuilder={noop}
        renderPicker={({
          enableDragAndDrop,
          onItemSelected,
        }: {
          enableDragAndDrop: boolean
          onItemSelected: () => void
        }) => (
          <TestPickerPanel
            enableDragAndDrop={enableDragAndDrop}
            hideTabs
            onItemSelected={onItemSelected}
          />
        )}
        shellMode='preview'
        utilityBar={<div>Dev Switcher</div>}
      />,
    )

    expect(screen.getByText(/Dev Switcher/i)).toBeInTheDocument()
    expect(screen.getByTestId('builder-v2-mobile-preview-shell')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('h-[100svh]')
    expect(screen.getByTestId('mobile-overview-shell')).toHaveClass('min-h-[100svh]')
    expect(screen.queryByTestId('builder-v2-mobile-preview-frame')).not.toBeInTheDocument()
  })

  it('does not render an invalid Step 1 / 0 header before quick-lineup state exists', () => {
    resetStore()

    const markup = renderToStaticMarkup(
      <MobileQuickLineup onExit={() => undefined} renderPicker={() => <div>Picker</div>} />,
    )

    expect(markup).not.toContain('Step 1 / 0')
  })
})
