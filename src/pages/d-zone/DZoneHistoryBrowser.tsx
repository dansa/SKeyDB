import {useEffect, useRef, useState, type KeyboardEvent, type RefObject} from 'react'

import {FaChevronRight, FaMagnifyingGlass, FaXmark} from 'react-icons/fa6'

import type {DzoneSeasonSummary} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'

import {formatDzoneSeasonBrowserDateRange} from './d-zone-date-format'
import {
  getDZoneHistoryYearButtonId,
  getDZoneHistoryYearPanelId,
  type DZoneHistoryYearGroup,
} from './d-zone-history-view-model'
import {getDzoneRealmIconAsset} from './d-zone-realm-assets'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const ARCHIVE_DATA_NOTE_ID = 'd-zone-history-archive-data-note'

interface DZoneHistoryBrowserProps {
  browserOpen: boolean
  expandedYears: Set<string>
  forceExpandedYears: boolean
  groups: DZoneHistoryYearGroup[]
  openerElement: HTMLElement | null
  search: string
  selectedSeasonId: string
  onBackdropClose: () => void
  onClose: () => void
  onSearchChange: (search: string) => void
  onSelectSeason: (seasonId: string) => void
  onToggleYear: (year: string) => void
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  )
}

function useDrawerModalBehavior({
  browserOpen,
  drawerRef,
  openerElement,
  onClose,
}: {
  browserOpen: boolean
  drawerRef: RefObject<HTMLElement | null>
  openerElement: HTMLElement | null
  onClose: () => void
}) {
  const onCloseRef = useRef(onClose)
  const openerElementRef = useRef(openerElement)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    openerElementRef.current = openerElement
  }, [openerElement])

  useEffect(() => {
    if (!browserOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const drawer = drawerRef.current
      if (!drawer) {
        return
      }

      const firstFocusable = getFocusableElements(drawer).at(0)
      if (firstFocusable) {
        firstFocusable.focus()
        return
      }

      drawer.focus()
    }, 0)

    function handleDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleDocumentKeyDown)
      openerElementRef.current?.focus()
    }
  }, [browserOpen, drawerRef])
}

export function DZoneHistoryBrowser({
  browserOpen,
  expandedYears,
  forceExpandedYears,
  groups,
  openerElement,
  search,
  selectedSeasonId,
  onBackdropClose,
  onClose,
  onSearchChange,
  onSelectSeason,
  onToggleYear,
}: DZoneHistoryBrowserProps) {
  const drawerRef = useRef<HTMLElement>(null)
  const [archiveNoteOpen, setArchiveNoteOpen] = useState(false)

  useDrawerModalBehavior({browserOpen, drawerRef, openerElement, onClose})

  function handleDrawerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!browserOpen || event.key !== 'Tab') {
      return
    }

    const drawer = drawerRef.current
    if (!drawer) {
      return
    }

    const focusableElements = getFocusableElements(drawer)
    if (focusableElements.length === 0) {
      event.preventDefault()
      drawer.focus()
      return
    }

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault()
      lastFocusable.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }

  return (
    <>
      <button
        aria-label='Close season browser'
        className='d-zone-history-drawer-backdrop'
        onClick={onBackdropClose}
        type='button'
      />

      <aside
        aria-modal={browserOpen ? true : undefined}
        aria-label='D-zone season archive'
        className='d-zone-history-sidebar'
        id='d-zone-history-browser'
        onKeyDown={handleDrawerKeyDown}
        ref={drawerRef}
        role={browserOpen ? 'dialog' : undefined}
        tabIndex={browserOpen ? -1 : undefined}
      >
        <div className='d-zone-history-heading-row'>
          <button
            aria-label='Close season browser'
            className='d-zone-history-drawer-close'
            onClick={onClose}
            type='button'
          >
            <FaXmark aria-hidden />
          </button>
        </div>

        <div className='d-zone-history-archive-note'>
          <button
            aria-controls={ARCHIVE_DATA_NOTE_ID}
            aria-expanded={archiveNoteOpen}
            className='d-zone-history-archive-note-trigger'
            onClick={() => {
              setArchiveNoteOpen((open) => !open)
            }}
            type='button'
          >
            <span>Archive data note</span>
            <FaChevronRight aria-hidden className='d-zone-history-archive-note-chevron' />
          </button>

          {archiveNoteOpen ? (
            <div
              className='d-zone-history-archive-note-panel'
              id={ARCHIVE_DATA_NOTE_ID}
              role='note'
            >
              <p>Historical D-Zone data is presented as a best-effort archive.</p>
              <p>
                Monster data, including levels and HP, comes from seasonal patch data when
                available, but may still be slightly inaccurate.
              </p>
              <p>Relics may have had different effects when that season was live.</p>
            </div>
          ) : null}
        </div>

        <div className='d-zone-history-controls'>
          <label className='d-zone-history-search'>
            <span className='sr-only'>Search D-zone seasons</span>
            <FaMagnifyingGlass aria-hidden className='d-zone-history-search-icon' />
            <input
              aria-label='Search D-zone seasons'
              onChange={(event) => {
                onSearchChange(event.target.value)
              }}
              placeholder='Search seasons...'
              type='search'
              value={search}
            />
          </label>
        </div>

        <div
          className='d-zone-history-year-list database-scrollbar'
          role='region'
          aria-label='D-zone season archive'
        >
          {groups.map((group) => {
            const expanded = forceExpandedYears || expandedYears.has(group.year)
            const panelId = getDZoneHistoryYearPanelId(group.year)
            const buttonId = getDZoneHistoryYearButtonId(group.year)

            return (
              <section className='d-zone-history-year-group' key={group.year}>
                <button
                  aria-controls={panelId}
                  aria-expanded={expanded}
                  className='d-zone-history-year-button'
                  id={buttonId}
                  onClick={() => {
                    onToggleYear(group.year)
                  }}
                  type='button'
                >
                  <FaChevronRight aria-hidden className='d-zone-history-year-chevron' />
                  <span>{group.year}</span>
                  <span className='d-zone-history-year-count'>
                    {group.seasons.length.toString()}
                  </span>
                </button>

                {expanded ? (
                  <div
                    aria-labelledby={buttonId}
                    className='d-zone-history-season-list'
                    id={panelId}
                  >
                    {group.seasons.map((season: DzoneSeasonSummary) => {
                      const displayName = getDzoneSeasonSummaryDisplayName(season)
                      const dateRange = formatDzoneSeasonBrowserDateRange(season)
                      const realmIconSrc = getDzoneRealmIconAsset(season.realm)
                      const selected = season.id === selectedSeasonId

                      return (
                        <button
                          aria-current={selected ? 'true' : undefined}
                          aria-label={`Select Season ${season.period.toString()}, ${displayName}, ${dateRange}${
                            selected ? ', current selection' : ''
                          }`}
                          className={`d-zone-history-season-button ${
                            selected ? 'd-zone-history-season-button--selected' : ''
                          }`}
                          key={season.id}
                          onClick={() => {
                            onSelectSeason(season.id)
                          }}
                          title={`${displayName} · ${season.stageEffect}`}
                          type='button'
                        >
                          <span className='d-zone-history-season-name'>
                            Season {season.period.toString()}
                            {realmIconSrc ? (
                              <img
                                alt={`${displayName} realm`}
                                className='d-zone-history-season-realm-badge'
                                decoding='async'
                                draggable={false}
                                loading='lazy'
                                src={realmIconSrc}
                              />
                            ) : (
                              <span aria-hidden className='d-zone-history-season-realm-empty' />
                            )}
                          </span>

                          <span className='d-zone-history-season-date'>{dateRange}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      </aside>
    </>
  )
}
