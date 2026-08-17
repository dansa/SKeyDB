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

import type {DatabaseDetailResultNavigation} from './database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from './DatabaseDetailResultNavigator'
import {DbDetailModalFrame} from './DbDetailModalFrame'
import {ResponsiveDetailArt} from './ResponsiveDetailArt'

type DatabasePopoverController = ReturnType<typeof useDatabasePopoverController>

interface DbDetailShellProps {
  artAsset?: string
  children:
    | ReactNode
    | ((tools: {isMobileViewport: boolean; openArtViewer: () => void}) => ReactNode)
  fullArtAlt: string
  itemName: string
  kindLabel: string
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  popoverController: DatabasePopoverController
  preferences: DatabaseDetailPreferences
  preserveSideArtIntrinsicSize?: boolean
  sideArtContainerClassName?: string
  sideArtClassName?: string
  sideArtFooter?: ReactNode
  sideArtWidthClassName?: string
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
  navigation = null,
  onClose,
  popoverController,
  preferences,
  preserveSideArtIntrinsicSize = false,
  sideArtContainerClassName = '',
  sideArtClassName = 'object-contain p-2',
  sideArtFooter,
  sideArtWidthClassName = 'w-[21rem]',
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
    isMobileHeader,
    isSettingsOpen,
    panelRef,
    setIsSettingsOpen,
    settingsRef,
  } = chrome
  const openArtViewer = () => {
    setIsArtViewerOpen(true)
  }
  const renderedChildren =
    typeof children === 'function'
      ? children({isMobileViewport: isMobileHeader, openArtViewer})
      : children

  const handleModalCancel = useDetailModalLifecycle({
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
    <DbDetailModalFrame
      ariaLabel={`${itemName} details`}
      header={<DatabaseDetailResultNavigator navigation={navigation} />}
      maxWidth='standard'
      onOverlayClick={handleOverlayClick}
      onPanelKeyDown={handlePanelKeyDown}
      onCancel={handleModalCancel}
      panelRef={panelRef}
      shellStyle={getDescriptionFontScaleStyle(preferences.shared.fontScale)}
    >
      <div className='relative flex min-h-0 flex-auto overflow-hidden border border-amber-200/55 bg-slate-950/[.985] shadow-[0_24px_70px_rgba(2,6,23,0.8)]'>
        <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
          <button
            aria-expanded={isSettingsOpen}
            aria-label='Open detail settings'
            className='inline-flex size-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
            data-detail-settings-trigger=''
            onClick={() => {
              setIsSettingsOpen((previous) => !previous)
            }}
            type='button'
          >
            <FaGear className='size-3.5' />
          </button>
          <button
            aria-label={`Close ${kindLabel} detail`}
            className='inline-flex size-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
            onClick={onClose}
            type='button'
          >
            <FaXmark className='size-4' />
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
          <ResponsiveDetailArt isMobileViewport={isMobileHeader} viewport='desktop'>
            <aside
              className={`flex shrink-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] ${sideArtWidthClassName}`}
              data-detail-art-viewport='desktop'
            >
              <div className='min-h-0 flex-1'>
                {artAsset ? (
                  <button
                    aria-label={`View full art for ${itemName}`}
                    className={`relative flex h-full w-full items-center justify-center overflow-hidden ${sideArtContainerClassName}`}
                    onClick={openArtViewer}
                    type='button'
                  >
                    <img
                      alt=''
                      className={`${preserveSideArtIntrinsicSize ? 'max-h-full max-w-full' : 'h-full w-full'} ${sideArtClassName}`}
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
              </div>
              {sideArtFooter}
            </aside>
          </ResponsiveDetailArt>

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
    </DbDetailModalFrame>
  )
}
