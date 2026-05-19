import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter, useLocation, useNavigate} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  installElementRectMock,
  installOffsetHeightFromRectMock,
  installStaticMatchMediaMock,
} from '@/test/domLayoutMocks'

import {DZoneHistoryPage} from './DZoneHistoryPage'

vi.mock('@/features/database/internal/DatabasePopoverRoot', () => ({
  DatabasePopoverRoot: () => null,
}))

vi.mock('./d-zone/useDZoneDatabasePopovers', () => ({
  useDZoneDatabasePopovers: () => ({
    closeOnOutsideClick: true,
    contextValue: {
      closeAllPopovers: vi.fn(),
      hasOpenPopovers: false,
      openNestedOverlay: vi.fn(),
      openNestedReferenceByName: vi.fn(),
      openRootOverlay: vi.fn(),
      openRootReferenceByName: vi.fn(),
    },
    openMonsterPopover: vi.fn(),
    openRelicPopover: vi.fn(),
    popoverRootProps: {},
  }),
}))

vi.mock('./timeline/useTimelineNow', () => ({
  useTimelineNow: () => new Date('2026-05-12T00:00:00Z'),
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid='location'>{`${location.pathname}${location.search}`}</output>
}

function BackProbe() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => {
        void navigate(-1)
      }}
      type='button'
    >
      Back one entry
    </button>
  )
}

function renderHistoryPage(initialEntries = ['/d-zone/history'], initialIndex?: number) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <DZoneHistoryPage />
      <LocationProbe />
      <BackProbe />
    </MemoryRouter>,
  )
}

async function findSeasonHeading(seasonNumber: number) {
  return screen.findByRole('heading', {level: 2, name: `Season ${seasonNumber.toString()}`})
}

function getDrawerCloseButton() {
  const closeButton = screen
    .getAllByRole('button', {name: 'Close season browser'})
    .find((button) => button.classList.contains('d-zone-history-drawer-close'))

  if (!(closeButton instanceof HTMLButtonElement)) {
    throw new Error('Expected drawer close button to render.')
  }

  return closeButton
}

function getDrawerBackdropButton() {
  const backdropButton = screen
    .getAllByRole('button', {name: 'Close season browser'})
    .find((button) => button.classList.contains('d-zone-history-drawer-backdrop'))

  if (!(backdropButton instanceof HTMLButtonElement)) {
    throw new Error('Expected drawer backdrop button to render.')
  }

  return backdropButton
}

function installWaveCardLayoutMock() {
  const restoreElementRectMock = installElementRectMock((element) => {
    const inlineHeight = Number.parseFloat(element.style.height)
    const height = element.classList.contains('d-zone-wave-card')
      ? Number.isFinite(inlineHeight)
        ? inlineHeight
        : element.classList.contains('d-zone-wave-card--expanded')
          ? 328
          : 96
      : 0

    return {
      height,
      width: 100,
    }
  })
  const restoreOffsetHeightMock = installOffsetHeightFromRectMock()

  return () => {
    restoreOffsetHeightMock()
    restoreElementRectMock()
  }
}

describe('DZoneHistoryPage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the archive selector with the current season selected', async () => {
    renderHistoryPage()

    expect(screen.getByRole('heading', {level: 1, name: 'D-Zone Archive'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Back to D-Zone'})).toHaveAttribute('href', '/d-zone')
    expect(
      screen.getByText('Browse past seasons, their stage lineups and relics.'),
    ).toBeInTheDocument()

    const currentSeasonButton = screen.getByRole('button', {name: /Select Season 60/i})
    expect(currentSeasonButton).toHaveAttribute('aria-current', 'true')
    expect(currentSeasonButton).toHaveAccessibleName(
      /Select Season 60, Aequor Ring, .*current selection/i,
    )
    expect(within(currentSeasonButton).getByText('Season 60')).toBeInTheDocument()
    expect(
      within(currentSeasonButton).getByRole('img', {name: 'Aequor Ring realm'}),
    ).toBeInTheDocument()
    expect(await findSeasonHeading(60)).toBeInTheDocument()
    expect(screen.getByRole('region', {name: 'Season 60 inspector'})).toHaveClass(
      'd-zone-season-inspector--realm-aequor',
    )
    expect(
      screen.getByText('Aequor Ring', {selector: '.d-zone-stage-chip-label'}),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Astral Reign', {selector: '.d-zone-stage-chip-label'}),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Select Alert V'}).closest('header')).toHaveClass(
      'd-zone-season-inspector-header',
    )

    const waveOneToggle = screen.getByRole('button', {name: 'Collapse Wave 1'})
    const waveTwoToggle = screen.getByRole('button', {name: 'Expand Wave 2'})
    expect(waveOneToggle).toHaveAttribute('aria-expanded', 'true')
    expect(waveTwoToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('button', {name: /Expand Wave/i})).toHaveLength(4)

    const waveTwo = screen.getByRole('article', {name: 'Wave 2'})
    expect(
      within(waveTwo).getByRole('heading', {level: 3, name: 'Initial Relics'}),
    ).toBeInTheDocument()
    expect(within(waveTwo).getByRole('heading', {level: 3, name: 'Monsters'})).toBeInTheDocument()
    expect(waveTwo.querySelector('.d-zone-monster-grid')).toHaveClass(
      'd-zone-monster-grid--overflowing',
    )
    expect(
      screen.getByRole('article', {name: 'Wave 3'}).querySelector('.d-zone-monster-grid'),
    ).not.toHaveClass('d-zone-monster-grid--overflowing')
    const waveOne = screen.getByRole('article', {name: 'Wave 1'})
    expect(within(waveOne).getByText('Lv 38')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Select Alert IV'}))
    expect(within(waveOne).getByText('Lv 73')).toBeInTheDocument()
    expect(within(waveOne).queryByText('Lv 38')).not.toBeInTheDocument()
    const waveTwoRelicButtons = within(waveTwo).getAllByRole('button', {
      name: /View Wave 2 relic details/i,
    })
    expect(waveTwoRelicButtons[1]).toHaveClass('d-zone-relic-button--compact')
    fireEvent.click(waveTwoToggle)
    expect(waveTwoToggle).toHaveAttribute('aria-expanded', 'true')
    expect(waveTwoRelicButtons[1]).not.toHaveClass('d-zone-relic-button--compact')
  })

  it('uses the season search param as a deep link and updates it on selection', async () => {
    renderHistoryPage(['/d-zone/history?season=dzone-0001'])

    expect(screen.getByTestId('location')).toHaveTextContent('/d-zone/history?season=dzone-0001')
    expect(await findSeasonHeading(1)).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', {name: /Search D-zone seasons/i}), {
      target: {value: 'season 2'},
    })
    const archivePanel = screen.getByRole('region', {name: /D-zone season archive/i})
    fireEvent.click(within(archivePanel).getByRole('button', {name: /^Select Season 2/i}))

    expect(await findSeasonHeading(2)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/d-zone/history?season=dzone-0002')
  })

  it('falls back for invalid season params without rewriting the URL', async () => {
    renderHistoryPage(['/d-zone/history?season=dzone-not-real&foo=bar'])

    expect(await findSeasonHeading(60)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/d-zone/history?season=dzone-not-real&foo=bar',
    )
  })

  it('preserves unrelated query params, replaces history, and keeps search text on selection', async () => {
    renderHistoryPage(['/origin', '/d-zone/history?foo=bar&season=dzone-0001'], 1)
    await findSeasonHeading(1)

    const searchBox = screen.getByRole('searchbox', {name: /Search D-zone seasons/i})
    fireEvent.change(searchBox, {target: {value: 'season 2'}})
    const archivePanel = screen.getByRole('region', {name: /D-zone season archive/i})
    fireEvent.click(within(archivePanel).getByRole('button', {name: /^Select Season 2/i}))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/d-zone/history?foo=bar&season=dzone-0002',
    )
    expect(searchBox).toHaveValue('season 2')

    fireEvent.click(screen.getByRole('button', {name: 'Back one entry'}))

    expect(screen.getByTestId('location')).toHaveTextContent('/origin')
  })

  it('auto-expands the selected season year after search-driven selection', async () => {
    renderHistoryPage(['/d-zone/history?season=dzone-0001'])
    await findSeasonHeading(1)

    expect(document.getElementById('d-zone-history-year-2026-button')).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    const searchBox = screen.getByRole('searchbox', {name: /Search D-zone seasons/i})
    fireEvent.change(searchBox, {target: {value: 'season 60'}})
    const archivePanel = screen.getByRole('region', {name: /D-zone season archive/i})
    fireEvent.click(within(archivePanel).getByRole('button', {name: /^Select Season 60/i}))
    fireEvent.change(searchBox, {target: {value: ''}})

    expect(document.getElementById('d-zone-history-year-2026-button')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('shows an archive data accuracy note from the season browser panel', () => {
    renderHistoryPage()

    fireEvent.click(screen.getByRole('button', {name: 'Archive data note'}))

    expect(screen.getByText(/Monster data, including levels and HP/i)).toBeVisible()
    expect(
      screen.getByText(/Relics may have had different effects when that season was live/i),
    ).toBeVisible()
  })

  it('keeps wave card height in sync after an interrupted toggle animation', async () => {
    const restoreLayoutMock = installWaveCardLayoutMock()
    const restoreMatchMediaMock = installStaticMatchMediaMock({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
    })

    try {
      renderHistoryPage()

      await findSeasonHeading(60)
      vi.useFakeTimers()
      const waveTwo = screen.getByRole('article', {name: 'Wave 2'})
      const waveTwoToggle = within(waveTwo).getByRole('button', {name: 'Expand Wave 2'})

      fireEvent.click(waveTwoToggle)
      expect(waveTwo).toHaveClass('d-zone-wave-card--expanded')
      expect(waveTwo).toHaveStyle({height: '328px'})

      fireEvent.click(waveTwoToggle)
      expect(waveTwo).toHaveClass('d-zone-wave-card--collapsed')
      expect(waveTwo).toHaveStyle({height: '96px'})

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(waveTwo).toHaveClass('d-zone-wave-card--collapsed')
      expect(waveTwo).not.toHaveAttribute('data-wave-motion')
      expect(waveTwo.style.height).toBe('')
      expect(within(waveTwo).getByRole('button', {name: 'Expand Wave 2'})).toHaveAttribute(
        'aria-expanded',
        'false',
      )
    } finally {
      restoreMatchMediaMock()
      restoreLayoutMock()
    }
  })

  it('opens and closes the season browser drawer from the trigger, close button, backdrop, and Escape', async () => {
    const user = userEvent.setup()
    renderHistoryPage()
    await findSeasonHeading(60)

    const trigger = screen.getByRole('button', {name: 'Open season browser drawer'})
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', {name: 'D-zone season archive'})).toHaveAttribute(
      'aria-modal',
      'true',
    )
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => {
      expect(getDrawerCloseButton()).toHaveFocus()
    })

    await user.click(getDrawerCloseButton())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(getDrawerBackdropButton())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    fireEvent.keyDown(document, {key: 'Escape'})
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('traps Tab inside the open drawer and restores focus to the opener', async () => {
    const user = userEvent.setup()
    renderHistoryPage()
    await findSeasonHeading(60)

    const trigger = screen.getByRole('button', {name: 'Open season browser drawer'})
    await user.click(trigger)

    const drawerCloseButton = getDrawerCloseButton()

    await waitFor(() => {
      expect(drawerCloseButton).toHaveFocus()
    })

    await user.tab({shift: true})
    expect(document.getElementById('d-zone-history-year-2024-button')).toHaveFocus()

    await user.click(drawerCloseButton)
    expect(trigger).toHaveFocus()
  })

  it('connects year disclosure buttons to deterministic panels', () => {
    renderHistoryPage()

    const yearButton = document.getElementById('d-zone-history-year-2026-button')
    expect(yearButton).toBeInstanceOf(HTMLButtonElement)
    expect(yearButton).toHaveAttribute('id', 'd-zone-history-year-2026-button')
    expect(yearButton).toHaveAttribute('aria-controls', 'd-zone-history-year-2026-panel')

    const panel = document.getElementById('d-zone-history-year-2026-panel')
    expect(panel).toHaveAttribute('aria-labelledby', 'd-zone-history-year-2026-button')
  })
})
