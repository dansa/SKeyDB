import {Suspense, useRef, useState, type ReactNode} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import type {
  DatabaseDetailPreferences,
  DatabaseDetailSharedPreferences,
} from '@/domain/database-detail-preferences'
import {clampAccountLevel} from '@/domain/gameplay-math-metadata'
import {DatabasePopoverContext} from '@/features/database/internal/database-popover-context'
import {DatabasePopoverRoot} from '@/features/database/internal/DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from '@/features/database/internal/font-scale'
import type {useDatabasePopoverController} from '@/features/database/internal/useDatabasePopoverController'
import {suppressDetailEntitySearchCapture} from '@/features/database/internal/useDetailEntitySearch'
import {ArtViewerOverlay} from '@/ui/modal/ArtViewerOverlay'
import {DetailSettingsPanel} from '@/ui/modal/DetailSettingsPanel'
import {useDetailModalChrome} from '@/ui/modal/useDetailModalChrome'
import {useDetailModalLifecycle} from '@/ui/modal/useDetailModalLifecycle'

type DatabasePopoverController = ReturnType<typeof useDatabasePopoverController>

interface DbDetailShellProps {
  artAsset?: string
  children: ReactNode | ((tools: {openArtViewer: () => void}) => ReactNode)
  fullArtAlt: string
  itemName: string
  kindLabel: string
  onClose: () => void
  popoverController: DatabasePopoverController
  preferences: DatabaseDetailPreferences
  sideArtClassName?: string
  showSideArtGradient?: boolean
  updateSharedPreferences: (nextPartial: Partial<DatabaseDetailSharedPreferences>) => void
}

const noop = () => {
  return undefined
}

export function DbDetailShell({
  artAsset,
  children,
  fullArtAlt,
  itemName,
  kindLabel,
  onClose,
  popoverController,
  preferences,
  sideArtClassName = 'object-contain p-2',
  showSideArtGradient = false,
  updateSharedPreferences,
}: DbDetailShellProps) {
  const [isArtViewerOpen, setIsArtViewerOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const chrome = useDetailModalChrome({
    clickOutsideClosesPopovers: preferences.shared.clickOutsideClosesPopovers,
    closeAllPopovers: popoverController.closeAllPopovers,
    closeSearch: undefined,
    hasOpenPopovers: popoverController.hasOpenPopovers,
    isSearchOpen: false,
    onClose,
  })
  const {
    handleOverlayClick,
    handlePanelKeyDown,
    isSettingsOpen,
    panelRef,
    setIsSettingsOpen,
    settingsRef,
  } = chrome
  const openArtViewer = () => {
    setIsArtViewerOpen(true)
  }
  const renderedChildren = typeof children === 'function' ? children({openArtViewer}) : children

  useDetailModalLifecycle({
    clearSearch: noop,
    closeAllPopovers: popoverController.closeAllPopovers,
    closeSearch: noop,
    dismissSettings: () => {
      setIsSettingsOpen(false)
    },
    hasOpenPopovers: popoverController.hasOpenPopovers,
    isSettingsOpen,
    onClose,
    searchInputRef,
    searchQuery: '',
  })

  return (
    <div
      className='fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/78 p-4 md:p-6'
      onClick={handleOverlayClick}
    >
      <div
        aria-label={`${itemName} details`}
        aria-modal='true'
        className='relative z-[901] flex max-h-[calc(100dvh-3rem)] min-h-[340px] w-full max-w-5xl overflow-hidden border border-amber-200/55 bg-slate-950/[.985] shadow-[0_24px_70px_rgba(2,6,23,0.8)]'
        data-detail-modal-shell=''
        onKeyDown={handlePanelKeyDown}
        ref={panelRef}
        role='dialog'
        style={getDescriptionFontScaleStyle(preferences.shared.fontScale)}
      >
        <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
          <button
            aria-expanded={isSettingsOpen}
            aria-label='Open detail settings'
            className='inline-flex h-8 w-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100'
            data-detail-settings-trigger=''
            onClick={() => {
              setIsSettingsOpen((previous) => !previous)
            }}
            type='button'
          >
            <FaGear className='h-3.5 w-3.5' />
          </button>
          <button
            aria-label={`Close ${kindLabel} detail`}
            className='inline-flex h-8 w-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100'
            onClick={onClose}
            type='button'
          >
            <FaXmark className='h-4 w-4' />
          </button>
          {isSettingsOpen ? (
            <DetailSettingsPanel
              accountLevel={preferences.shared.accountLevel}
              clickOutsideClosesPopovers={preferences.shared.clickOutsideClosesPopovers}
              fontScale={preferences.shared.fontScale}
              onAccountLevelChange={(nextAccountLevel) => {
                updateSharedPreferences({accountLevel: clampAccountLevel(nextAccountLevel)})
              }}
              onClickOutsideClosesPopoversChange={(nextClickOutsideClosesPopovers) => {
                updateSharedPreferences({
                  clickOutsideClosesPopovers: nextClickOutsideClosesPopovers,
                })
              }}
              onFontScaleChange={(nextFontScale) => {
                updateSharedPreferences({fontScale: nextFontScale})
              }}
              onShowTagIconsChange={(nextShowTagIcons) => {
                updateSharedPreferences({showTagIcons: nextShowTagIcons})
              }}
              showTagIcons={preferences.shared.showTagIcons}
            />
          ) : null}
        </div>

        <DatabasePopoverContext.Provider value={popoverController.contextValue}>
          <aside className='hidden w-[21rem] shrink-0 overflow-hidden bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] md:block'>
            {artAsset ? (
              <button
                aria-label={`View full art for ${itemName}`}
                className='relative h-full w-full overflow-hidden'
                onClick={openArtViewer}
                type='button'
              >
                <img
                  alt=''
                  className={`h-full w-full ${sideArtClassName}`}
                  draggable={false}
                  src={artAsset}
                />
                {showSideArtGradient ? (
                  <div
                    aria-hidden
                    className='pointer-events-none absolute inset-y-0 right-0 left-0 bg-[linear-gradient(90deg,#020617_0%,transparent_16%,transparent_84%,#020617_100%)]'
                  />
                ) : null}
              </button>
            ) : null}
          </aside>

          <div className='flex min-h-0 min-w-0 flex-1 flex-col px-4 py-4 pr-12 sm:px-5 sm:py-5 md:px-6 md:py-5'>
            {renderedChildren}
            <Suspense fallback={null}>
              <DatabasePopoverRoot
                {...popoverController.popoverRootProps}
                fontScale={preferences.shared.fontScale}
                showTagIcons={preferences.shared.showTagIcons}
              />
            </Suspense>
          </div>
        </DatabasePopoverContext.Provider>

        {isArtViewerOpen && artAsset ? (
          <ArtViewerOverlay
            alt={fullArtAlt}
            onMount={suppressDetailEntitySearchCapture}
            onClose={() => {
              setIsArtViewerOpen(false)
            }}
            src={artAsset}
          />
        ) : null}
      </div>
    </div>
  )
}
