import {Suspense, useMemo, useState} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
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
  onClose: () => void
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

export function WheelDetailModal({
  fullData,
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
  const fullArtAlt = useMemo(() => `${wheel.name} full art`, [wheel.name])

  return (
    <div
      className='fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/78 p-4 md:p-6'
      onClick={handleOverlayClick}
    >
      <div
        className='relative z-[901] flex w-full max-w-6xl flex-col gap-2.5 md:gap-3'
        data-detail-modal-shell=''
        onKeyDown={handlePanelKeyDown}
      >
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

        <div
          aria-label={`${wheel.name} details`}
          aria-modal='true'
          className='relative flex max-h-[calc(100dvh-7rem)] min-h-[350px] w-full overflow-hidden border border-amber-200/55 bg-slate-950/[.985] pb-5 shadow-[0_24px_70px_rgba(2,6,23,0.8)] md:max-h-[calc(100dvh-8rem)]'
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
              aria-label='Close wheel detail'
              className='inline-flex h-8 w-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100'
              onClick={onClose}
              type='button'
            >
              <FaXmark className='h-4 w-4' />
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
            <div className='flex max-h-[calc(100dvh-8rem)] min-h-0'>
              <aside className='database-scrollbar hidden w-[18.75rem] shrink-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] px-6 py-6 md:flex md:items-start md:justify-center'>
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
      </div>
    </div>
  )
}
