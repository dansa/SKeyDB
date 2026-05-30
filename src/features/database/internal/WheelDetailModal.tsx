import {Suspense, useState} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import type {DatabaseDetailResultNavigation} from '@/features/database/detail/database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from '@/features/database/detail/DatabaseDetailResultNavigator'
import {DbDetailModalFrame} from '@/features/database/detail/DbDetailModalFrame'
import {ArtViewerOverlay} from '@/ui/modal/ArtViewerOverlay'

import {DatabasePopoverContext} from './database-popover-context'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from './font-scale'
import {suppressDetailEntitySearchCapture} from './useDetailEntitySearch'
import {useWheelDetailModalState} from './useWheelDetailModalState'
import {WheelDetailArtwork} from './WheelDetailArtwork'
import {WheelDetailContent} from './WheelDetailContent'
import {WheelDetailSearchBar} from './WheelDetailSearchBar'
import {WheelDetailSettingsPanel} from './WheelDetailSettingsPanel'

interface WheelDetailModalProps {
  wheel: Wheel
  wheels?: Wheel[]
  fullData: WheelFullRecord
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'id' | 'name'>) => void
}

export function WheelDetailModal({
  fullData,
  navigation = null,
  onClose,
  onSelectAwakener,
  onSelectWheel,
  wheel,
  wheels = [wheel],
}: WheelDetailModalProps) {
  return (
    <WheelDetailModalInner
      fullData={fullData}
      key={wheel.id}
      navigation={navigation}
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
      onSelectWheel={onSelectWheel}
      wheel={wheel}
      wheels={wheels}
    />
  )
}

function WheelDetailModalInner({
  fullData,
  navigation = null,
  onClose,
  onSelectAwakener,
  onSelectWheel,
  wheel,
  wheels = [wheel],
}: WheelDetailModalProps) {
  const [isArtViewerOpen, setIsArtViewerOpen] = useState(false)
  const {
    chrome,
    descriptionRank,
    enhanceLevel,
    formulaContext,
    preferences,
    popoverContextValue,
    popoverRootProps,
    referenceLayer,
    resolvedMainstatValue,
    search,
    setEnhanceLevel,
    updateSharedPreferences,
    updateWheelPreferences,
    wheelDescriptionRecord,
  } = useWheelDetailModalState({
    fullData,
    onClose,
    onSelectWheel,
    wheel,
    wheels,
  })
  const {
    handleOverlayClick,
    handlePanelKeyDown,
    isSettingsOpen,
    panelRef,
    settingsRef,
    setIsSettingsOpen,
  } = chrome
  const wheelAsset = getWheelAssetById(wheel.id)
  const fullArtAlt = `${wheel.name} full art`

  return (
    <DbDetailModalFrame
      ariaLabel={`${wheel.name} details`}
      beforeBody={
        <>
          <div className='shrink-0'>
            <WheelDetailSearchBar
              activeIndex={search.activeSearchIndex}
              containerRef={search.searchContainerRef}
              inputRef={search.searchInputRef}
              isOpen={search.isSearchOpen}
              onInputFocus={() => {
                if (search.searchQuery.trim().length > 0) {
                  search.openSearch()
                }
              }}
              onInputKeyDown={search.handleSearchInputKeyDown}
              onQueryChange={search.handleSearchQueryChange}
              onSelectWheel={search.handleSelectResult}
              query={search.searchQuery}
              results={search.searchResults}
            />
          </div>
          <DatabaseDetailResultNavigator navigation={navigation} />
        </>
      }
      onOverlayClick={handleOverlayClick}
      onPanelKeyDown={handlePanelKeyDown}
      panelRef={panelRef}
      shellStyle={getDescriptionFontScaleStyle(preferences.shared.fontScale)}
    >
      <div className='relative flex min-h-0 flex-auto overflow-hidden border border-amber-200/55 bg-slate-950/[.985] pb-5 shadow-[0_24px_70px_rgba(2,6,23,0.8)]'>
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
            aria-label='Close wheel detail'
            className='inline-flex size-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
            onClick={onClose}
            type='button'
          >
            <FaXmark className='size-4' />
          </button>
          {isSettingsOpen ? (
            <WheelDetailSettingsPanel
              onUpdateSharedPreferences={updateSharedPreferences}
              onUpdateWheelPreferences={updateWheelPreferences}
              preferences={preferences.wheel}
              sharedPreferences={preferences.shared}
            />
          ) : null}
        </div>
        <DatabasePopoverContext.Provider value={popoverContextValue}>
          <div className='flex min-h-0 flex-1'>
            <aside className='database-scrollbar hidden w-[18.75rem] shrink-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] p-6 md:flex md:items-start md:justify-center'>
              <WheelDetailArtwork
                onOpenFullArt={
                  wheelAsset
                    ? () => {
                        setIsArtViewerOpen(true)
                      }
                    : undefined
                }
                wheel={wheel}
              />
            </aside>

            <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
              <div className='flex min-h-0 flex-1 flex-col px-4 py-4 pr-5 sm:px-5 sm:py-5 md:px-6 md:py-5'>
                <WheelDetailContent
                  descriptionRank={descriptionRank}
                  enhanceLevel={enhanceLevel}
                  expandLoreByDefault={preferences.wheel.expandLoreByDefault}
                  fullData={fullData}
                  formulaContext={formulaContext}
                  mainstatValue={resolvedMainstatValue}
                  mobileArtwork={
                    <WheelDetailArtwork
                      onOpenFullArt={
                        wheelAsset
                          ? () => {
                              setIsArtViewerOpen(true)
                            }
                          : undefined
                      }
                      variant='compact'
                      wheel={wheel}
                    />
                  }
                  onEnhanceLevelChange={setEnhanceLevel}
                  onSelectAwakener={onSelectAwakener}
                  referenceLayer={referenceLayer}
                  showTagIcons={preferences.shared.showTagIcons}
                  wheel={wheel}
                  wheelDescriptionRecord={wheelDescriptionRecord}
                />
                <Suspense fallback={null}>
                  <DatabasePopoverRoot
                    {...popoverRootProps}
                    fontScale={preferences.shared.fontScale}
                    showTagIcons={preferences.shared.showTagIcons}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </DatabasePopoverContext.Provider>
      </div>
      {isArtViewerOpen && wheelAsset ? (
        <ArtViewerOverlay
          alt={fullArtAlt}
          onMount={suppressDetailEntitySearchCapture}
          onClose={() => {
            setIsArtViewerOpen(false)
          }}
          src={wheelAsset}
        />
      ) : null}
    </DbDetailModalFrame>
  )
}
