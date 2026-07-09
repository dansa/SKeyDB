import {Suspense, useLayoutEffect, useMemo, useRef, useState} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import type {DatabaseDetailResultNavigation} from '@/features/database/detail/database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from '@/features/database/detail/DatabaseDetailResultNavigator'
import {DbDetailModalFrame} from '@/features/database/detail/DbDetailModalFrame'
import {ArtViewerOverlay} from '@/ui/modal/ArtViewerOverlay'

import {DatabaseDetailTagStrip} from './DatabaseDetailTagStrip'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from './font-scale'
import {suppressDetailEntitySearchCapture} from './useDetailEntitySearch'
import {PopoverProvider} from './usePopoverStore'
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
    <PopoverProvider>
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
    </PopoverProvider>
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
    handleModalCancel,
    preferences,
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
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const prevWheelIdRef = useRef(wheel.id)
  useLayoutEffect(() => {
    if (wheel.id !== prevWheelIdRef.current) {
      prevWheelIdRef.current = wheel.id
      setIsTagsOpen(false)
    }
  }, [wheel.id])
  const wheelAsset = getWheelAssetById(wheel.id)
  const fullArtAlt = `${wheel.name} full art`
  const mobileArtwork = useMemo(
    () => (
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
    ),
    [wheel, wheelAsset],
  )
  return (
    <DbDetailModalFrame
      ariaLabel={`${wheel.name} details`}
      header={
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
      onCancel={handleModalCancel}
      panelRef={panelRef}
      shellStyle={getDescriptionFontScaleStyle(preferences.shared.fontScale)}
    >
      <div className='relative flex min-h-0 flex-auto overflow-hidden border border-amber-200/55 bg-slate-950/[.97] shadow-[0_18px_50px_rgba(2,6,23,0.72)]'>
        <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
          {fullData.searchTags.length > 0 ? (
            <div className='relative inline-block'>
              <button
                aria-expanded={isTagsOpen}
                className='inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium text-slate-400 transition-colors hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
                onClick={() => {
                  setIsTagsOpen(!isTagsOpen)
                }}
                type='button'
                data-testid='tags-burger-button'
              >
                <svg
                  className='size-3.5 shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
                <span>Tags</span>
                <svg
                  className={`size-3 shrink-0 transition-transform duration-200 ${
                    isTagsOpen ? 'rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>
              {isTagsOpen ? (
                <div className='animate-in fade-in slide-in-from-top-1 absolute top-full right-[-5.5rem] z-20 mt-1.5 w-max max-w-[calc(100vw-2rem)] rounded border border-slate-700/65 bg-slate-950/95 p-2.5 shadow-xl backdrop-blur-md duration-100 sm:right-0 sm:max-w-md'>
                  <DatabaseDetailTagStrip
                    className='max-w-xl'
                    itemKey={wheel.id}
                    tags={fullData.searchTags}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
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
        <div className='flex min-h-0 flex-1'>
          <aside className='database-scrollbar hidden w-[18.75rem] shrink-0 overflow-y-auto py-4 pr-2 pl-4 md:flex md:items-center md:justify-center'>
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
          <div className='flex min-h-0 min-w-0 flex-1 flex-col pt-4 md:pt-5'>
            <div className='flex min-h-0 flex-1 flex-col'>
              <WheelDetailContent
                descriptionRank={descriptionRank}
                enhanceLevel={enhanceLevel}
                fullData={fullData}
                formulaContext={formulaContext}
                mainstatValue={resolvedMainstatValue}
                mobileArtwork={mobileArtwork}
                onEnhanceLevelChange={setEnhanceLevel}
                onSelectAwakener={onSelectAwakener}
                referenceLayer={referenceLayer}
                showTagIcons={preferences.shared.showTagIcons}
                wheel={wheel}
                wheelDescriptionRecord={wheelDescriptionRecord}
              />
              <Suspense fallback={null}>
                <DatabasePopoverRoot {...popoverRootProps} />
              </Suspense>
            </div>
          </div>
        </div>
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
