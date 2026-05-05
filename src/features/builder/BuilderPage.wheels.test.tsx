import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import './builder-page.integration-mocks'

import {dbDetailStore} from '@/stores/dbDetailStore'

import {BuilderPage} from './BuilderPage'

afterEach(() => {
  dbDetailStore.getState().closeAllDetails()
  vi.unstubAllGlobals()
})

describe('BuilderPage wheels', () => {
  it('uses the larger of the builder zone height and available viewport height for the picker shell', () => {
    class ResizeObserverMock {
      private readonly callback: ResizeObserverCallback

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
      }

      disconnect() {
        return undefined
      }

      observe(target: Element) {
        if (target instanceof HTMLElement && target.dataset.builderMainZone === 'true') {
          this.callback(
            [
              {
                borderBoxSize: [],
                contentBoxSize: [],
                contentRect: {
                  bottom: 0,
                  height: 604,
                  left: 0,
                  right: 0,
                  toJSON() {
                    return {}
                  },
                  top: 0,
                  width: 0,
                  x: 0,
                  y: 0,
                },
                devicePixelContentBoxSize: [],
                target,
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          )
        }
      }

      unobserve() {
        return undefined
      }
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('innerHeight', 950)
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect(this: HTMLElement) {
        if (this instanceof HTMLElement && this.dataset.builderMainZone === 'true') {
          return {
            bottom: 760,
            height: 604,
            left: 0,
            right: 0,
            toJSON() {
              return {}
            },
            top: 156,
            width: 0,
            x: 0,
            y: 156,
          }
        }

        if (this instanceof HTMLElement && this.dataset.pickerZone === 'true') {
          return {
            bottom: 760,
            height: 0,
            left: 0,
            right: 0,
            toJSON() {
              return {}
            },
            top: 157,
            width: 0,
            x: 0,
            y: 157,
          }
        }

        return {
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          toJSON() {
            return {}
          },
          top: 0,
          width: 0,
          x: 0,
          y: 0,
        }
      })

    render(<BuilderPage />)

    const pickerPanel = document.querySelector('[data-picker-zone="true"]')
    expect(pickerPanel).not.toBeNull()
    const layout = pickerPanel?.parentElement
    expect(layout?.classList.contains('items-start')).toBe(true)
    const pickerPanelClasses = Array.from(pickerPanel?.classList ?? [])
    expect(pickerPanelClasses.includes('lg:h-[var(--builder-picker-shell-height)]')).toBe(true)
    expect(pickerPanelClasses.includes('lg:min-h-[var(--builder-main-zone-height)]')).toBe(true)
    expect(pickerPanelClasses.includes('lg:max-h-[var(--builder-picker-shell-height)]')).toBe(true)
    expect(
      (pickerPanel as HTMLElement | null)?.style.getPropertyValue('--builder-main-zone-height'),
    ).toBe('604px')
    expect(
      (pickerPanel as HTMLElement | null)?.style.getPropertyValue('--builder-picker-shell-height'),
    ).toBe('793px')

    const tabNames = [/^awakeners$/i, /^wheels$/i, /^covenants$/i, /^posses$/i] as const
    for (const tabName of tabNames) {
      fireEvent.click(screen.getByRole('tab', {name: tabName}))
      const scrollContainer = document.querySelector('.builder-picker-scrollbar')
      expect(scrollContainer).not.toBeNull()
      expect(scrollContainer?.classList.contains('flex-1')).toBe(true)
      expect(scrollContainer?.classList.contains('min-h-0')).toBe(true)
    }

    getBoundingClientRectSpy.mockRestore()
  })

  it('treats both active slot sockets as wheel slots', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0])
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))
    expect(screen.getAllByRole('button', {name: /edit wheel/i})[0]).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0])
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Search wheels (name, rarity, realm, awakener, main stat)',
    )
  })

  it('labels wheels already used in the active team inside picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0])
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const wheelTile = screen.getByRole('button', {name: /merciful nurturing wheel/i})
    expect(wheelTile).toHaveTextContent(/in use/i)
  })

  it('keeps dedicated image scale classes for picker and card wheel tiles', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))
    const pickerWheel = screen.getByRole('button', {name: /merciful nurturing wheel/i})
    const pickerImage = pickerWheel.querySelector('img')
    expect(pickerImage).not.toBeNull()
    expect(pickerImage?.classList.contains('builder-picker-wheel-image')).toBe(true)

    fireEvent.click(screen.getAllByRole('tab', {name: /^awakeners$/i})[0])
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0])
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const editWheelButton = screen.getAllByRole('button', {name: /edit wheel/i})[0]
    const cardWheelTile = editWheelButton.closest('.wheel-tile')
    const cardImage = cardWheelTile?.querySelector('img')
    expect(cardImage).not.toBeNull()
    expect(cardImage?.classList.contains('builder-card-wheel-image')).toBe(true)
  })

  it('renders independent wheel rarity and mainstat filter controls', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))

    const raritySsr = screen.getByRole('button', {name: 'SSR'})
    const mainstatCritRate = screen.getByRole('button', {name: /filter wheels by crit rate/i})

    fireEvent.click(raritySsr)
    expect(raritySsr).toHaveAttribute('aria-pressed', 'true')
    expect(mainstatCritRate).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(mainstatCritRate)
    expect(raritySsr).toHaveAttribute('aria-pressed', 'true')
    expect(mainstatCritRate).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows recommendation toggles on the wheels picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))
    fireEvent.click(screen.getByRole('button', {name: /sorting & toggles/i}))

    expect(screen.getByText('Promote Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Promote Mainstat Matches')).toBeInTheDocument()
  })

  it('shows recommendation chips on promoted wheel tiles for the active awakener', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))

    await waitFor(() => {
      const bisWheelTile = screen.getByRole('button', {name: /tablet of scriptures wheel/i})
      expect(bisWheelTile).toHaveTextContent('BiS')
      expect(screen.queryByAltText(/recommended mainstat crit dmg/i)).not.toBeInTheDocument()

      const goodWheelTile = screen.getByRole('button', {name: /merciful nurturing wheel/i})
      expect(goodWheelTile).toHaveTextContent('Good')
    })
  })

  it('shows ordered mainstat chips only on non-tagged promoted fallback wheels', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))
    fireEvent.click(screen.getByRole('button', {name: /sorting & toggles/i}))
    const promoteMainstatRow = screen.getByText('Promote Mainstat Matches').closest('div')
    expect(promoteMainstatRow).not.toBeNull()
    if (!promoteMainstatRow) {
      throw new Error('Expected promote mainstat toggle row to be present')
    }
    fireEvent.click(within(promoteMainstatRow).getByRole('button'))

    await waitFor(() => {
      const wheelButtons = screen.getAllByRole('button')
      const keyflareChip = screen.getByAltText(/recommended mainstat keyflare regen/i)
      const aliemusChip = screen.getByAltText(/recommended mainstat aliemus regen/i)
      expect(keyflareChip).toBeInTheDocument()
      expect(aliemusChip).toBeInTheDocument()

      const firstMainstatTile = keyflareChip.closest('button')
      const secondMainstatTile = aliemusChip.closest('button')
      expect(firstMainstatTile).not.toBeNull()
      expect(secondMainstatTile).not.toBeNull()
      if (!firstMainstatTile || !secondMainstatTile) {
        throw new Error('Expected recommended mainstat chips to render inside wheel tiles')
      }
      expect(wheelButtons.indexOf(firstMainstatTile)).toBeLessThan(
        wheelButtons.indexOf(secondMainstatTile),
      )
    })
  })

  it('uses standard plus sigil for unset wheel slots on cards', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))

    const setWheelButtons = screen.getAllByRole('button', {name: /set wheel/i})
    const firstUnsetWheel = setWheelButtons[0]?.closest('.wheel-tile')
    expect(firstUnsetWheel).not.toBeNull()
    expect(firstUnsetWheel?.querySelector('.sigil-placeholder-wheel')).not.toBeNull()
    expect(firstUnsetWheel?.querySelector('.sigil-placeholder-remove')).toBeNull()
    expect(firstUnsetWheel?.querySelector('.sigil-remove-x')).toBeNull()
  })

  it('renders wheel remove action inside the active wheel tile', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0])
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const removeButton = screen.getByRole('button', {name: /remove active wheel/i})
    expect(removeButton.closest('.wheel-tile')).not.toBeNull()
  })

  it('assigns wheel to first empty slot when awakener card is active', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    expect(screen.getAllByRole('button', {name: /edit wheel/i})).toHaveLength(1)
    expect(screen.getAllByRole('button', {name: /set wheel/i})).toHaveLength(1)
  })

  it('keeps awakener active while quick-clicking two wheels from picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))
    fireEvent.click(screen.getByRole('button', {name: /tablet of scriptures/i}))

    expect(screen.getByRole('button', {name: /remove active awakener/i})).toBeInTheDocument()
    expect(screen.getAllByRole('button', {name: /edit wheel/i})).toHaveLength(2)
    expect(screen.queryByRole('button', {name: /set wheel/i})).not.toBeInTheDocument()
  })

  it('opens active card wheel details by public id without selecting the wheel slot', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0])
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))
    fireEvent.click(screen.getAllByTitle(/open merciful nurturing details overlay/i)[0])

    expect(dbDetailStore.getState().stack.at(-1)).toEqual({
      kind: 'wheel',
      id: 'wheel-0050',
      source: 'builder-overlay',
    })
    expect(screen.getByRole('button', {name: /remove active wheel/i})).toBeInTheDocument()
  })
})
