import {
  lazy,
  Suspense,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {type Awakener} from '@/domain/awakeners'
import {type AwakenerFullRecord} from '@/domain/awakeners-full'
import type {Covenant} from '@/domain/covenants'
import {
  DATABASE_AWAKENER_VISIBLE_TABS,
  resolveDatabaseAwakenerVisibleTab,
  type DatabaseAwakenerTab,
  type DatabaseAwakenerVisibleTab,
} from '@/domain/database-paths'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {isPreReleaseAwakener} from '@/domain/pre-release'
import {getRealmAccent, getRealmIcon, getRealmLabel} from '@/domain/realms'
import type {Wheel} from '@/domain/wheels'
import type {DatabaseDetailResultNavigation} from '@/features/database/detail/database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from '@/features/database/detail/DatabaseDetailResultNavigator'
import {DbDetailModalFrame} from '@/features/database/detail/DbDetailModalFrame'
import {PreReleaseDataNotice} from '@/features/database/detail/PreReleaseDataNotice'
import {ArtViewerOverlay} from '@/ui/modal/ArtViewerOverlay'

import {AwakenerDetailLore, AwakenerDetailOverview} from './AwakenerDetailOverview'
import {AwakenerDetailSearchBar} from './AwakenerDetailSearchBar'
import {AwakenerDetailSettingsPanel} from './AwakenerDetailSettingsPanel'
import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {AwakenerDetailUpgrades} from './AwakenerDetailUpgrades'
import {DatabasePopoverContext} from './database-popover-context'
import {DatabaseDetailTagStrip} from './DatabaseDetailTagStrip'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from './font-scale'
import {useAwakenerDetailModalState} from './useAwakenerDetailModalState'
import {suppressDetailEntitySearchCapture} from './useDetailEntitySearch'

interface AwakenerDetailModalProps {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  fullData: AwakenerFullRecord
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'id' | 'name'>) => void
  onSelectCovenant?: (covenant: Pick<Covenant, 'id' | 'name'>) => void
}

const DATABASE_AWAKENER_TAB_LABELS: Record<DatabaseAwakenerVisibleTab, string> = {
  upgrades: 'Upgrades',
  skills: 'Skills',
  builds: 'Builds',
  lore: 'Lore',
}

const TAB_CONTENT_LOADING_FALLBACK = <div className='py-3 text-sm text-slate-300'>Loading tab…</div>

const AwakenerDetailCards = lazy(() =>
  import('./AwakenerDetailCards').then((module) => ({default: module.AwakenerDetailCards})),
)
const AwakenerBuildsTab = lazy(() =>
  import('./AwakenerBuildsTab').then((module) => ({default: module.AwakenerBuildsTab})),
)

export function AwakenerDetailModal({
  activeTab: routeActiveTab,
  awakener,
  awakeners,
  fullData,
  navigation = null,
  onClose,
  onTabChange,
  onSelectAwakener,
  onSelectWheel,
  onSelectCovenant,
}: AwakenerDetailModalProps) {
  const tabButtonRefs = useRef<Partial<Record<DatabaseAwakenerTab, HTMLButtonElement | null>>>({})
  const [isArtViewerOpen, setIsArtViewerOpen] = useState(false)
  const [areStatsExpanded, setAreStatsExpanded] = useState(false)
  const tabsetId = useId()
  const {
    activeSearchIndex,
    activeTab,
    handleOverlayClick,
    handlePanelKeyDown,
    handleSearchInputKeyDown,
    handleSearchQueryChange,
    handleSelectAwakenerFromSearch,
    isMobileHeader,
    isSearchOpen,
    isSettingsOpen,
    openSearch,
    panelRef,
    popoverContextValue,
    popoverRootProps,
    searchContainerRef,
    searchInputRef,
    searchQuery,
    searchResults,
    setActiveTab,
    setIsSettingsOpen,
    session,
    settingsRef,
  } = useAwakenerDetailModalState({
    activeTab: resolveDatabaseAwakenerVisibleTab(routeActiveTab),
    awakeners,
    fullData,
    onClose,
    onSelectAwakener,
    onSelectCovenant,
    onSelectWheel,
    onTabChange,
  })
  const {
    actions: sessionActions,
    preferences: sessionPreferences,
    runtime: sessionRuntime,
  } = session
  const {awakener: awakenerPreferences, shared: sharedPreferences} = sessionPreferences
  const fontScale = sharedPreferences.fontScale
  const {referenceLayer, resolvedControls, resolvedSelection, resolvedStats, shellView} =
    sessionRuntime
  const usesProfileSidebar = activeTab === 'overview' || activeTab === 'lore'

  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmAccent = getRealmAccent(awakener.realm)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const portrait = getAwakenerPortraitAsset(awakener.name)
  const tabPanelId = `${tabsetId}-panel`
  const fullArtAlt = `${displayName} full art`
  const headerMetaItems = [
    {key: 'realm', label: realmLabel, color: realmAccent},
    {
      key: 'type',
      label: awakener.type ? awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase() : '—',
    },
    awakener.faction ? {key: 'faction', label: awakener.faction} : null,
  ].filter((item): item is {key: string; label: string; color?: string} => item !== null)

  function focusTab(tab: DatabaseAwakenerVisibleTab) {
    tabButtonRefs.current[tab]?.focus()
  }

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentTab: DatabaseAwakenerVisibleTab,
  ) {
    const currentIndex = DATABASE_AWAKENER_VISIBLE_TABS.indexOf(currentTab)
    if (currentIndex === -1) {
      return
    }

    let nextTab: DatabaseAwakenerVisibleTab | null = null
    if (event.key === 'ArrowRight') {
      nextTab =
        DATABASE_AWAKENER_VISIBLE_TABS[(currentIndex + 1) % DATABASE_AWAKENER_VISIBLE_TABS.length]
    } else if (event.key === 'ArrowLeft') {
      nextTab =
        DATABASE_AWAKENER_VISIBLE_TABS[
          (currentIndex - 1 + DATABASE_AWAKENER_VISIBLE_TABS.length) %
            DATABASE_AWAKENER_VISIBLE_TABS.length
        ]
    } else if (event.key === 'Home') {
      nextTab = DATABASE_AWAKENER_VISIBLE_TABS[0]
    } else if (event.key === 'End') {
      nextTab = DATABASE_AWAKENER_VISIBLE_TABS[DATABASE_AWAKENER_VISIBLE_TABS.length - 1]
    }

    if (!nextTab) {
      return
    }

    event.preventDefault()
    setActiveTab(nextTab)
    focusTab(nextTab)
  }

  return (
    <DbDetailModalFrame
      ariaLabel={`${displayName} details`}
      beforeBody={
        <>
          <div className='shrink-0'>
            <AwakenerDetailSearchBar
              activeIndex={activeSearchIndex}
              containerRef={searchContainerRef}
              inputRef={searchInputRef}
              isOpen={isSearchOpen}
              onInputKeyDown={handleSearchInputKeyDown}
              onInputFocus={() => {
                if (searchQuery.trim().length > 0) {
                  openSearch()
                }
              }}
              onQueryChange={handleSearchQueryChange}
              onSelectAwakener={handleSelectAwakenerFromSearch}
              query={searchQuery}
              results={searchResults}
            />
          </div>
          <DatabaseDetailResultNavigator navigation={navigation} />
        </>
      }
      onOverlayClick={handleOverlayClick}
      onPanelKeyDown={handlePanelKeyDown}
      panelRef={panelRef}
      shellStyle={getDescriptionFontScaleStyle(fontScale)}
    >
      <div className='relative flex min-h-0 flex-auto overflow-hidden border border-amber-200/55 bg-slate-950/[.97] shadow-[0_18px_50px_rgba(2,6,23,0.72)]'>
        <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
          <button
            aria-expanded={isSettingsOpen}
            aria-label='Open detail settings'
            className='inline-flex size-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
            data-detail-settings-trigger=''
            onClick={() => {
              setIsSettingsOpen((previous) => !previous)
            }}
            type='button'
          >
            <FaGear className='size-3.5' />
          </button>
          <button
            aria-label='Close detail'
            className='inline-flex size-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
            onClick={onClose}
            type='button'
          >
            <FaXmark className='size-4' />
          </button>
          {isSettingsOpen ? (
            <AwakenerDetailSettingsPanel
              controls={resolvedControls}
              onPatchDefaultSelection={sessionActions.patchDefaultSelection}
              onUpdateAwakenerPreferences={sessionActions.updateAwakenerPreferences}
              onUpdateSharedPreferences={sessionActions.updateSharedPreferences}
              preferences={awakenerPreferences}
              sharedPreferences={sharedPreferences}
            />
          ) : null}
        </div>
        <DatabasePopoverContext.Provider value={popoverContextValue}>
          <div className='flex min-h-0 flex-1'>
            <aside className='database-scrollbar hidden w-56 shrink-0 overflow-y-auto border-r border-slate-700/40 p-4 md:block lg:w-64'>
              <AwakenerDetailSidebar
                awakener={awakener}
                controls={resolvedControls}
                onOpenFullArt={
                  cardAsset
                    ? () => {
                        setIsArtViewerOpen(true)
                      }
                    : undefined
                }
                onPatchSelection={sessionActions.patchSelection}
                onStatsExpandedChange={setAreStatsExpanded}
                scalingRecord={fullData}
                selection={resolvedSelection}
                stats={resolvedStats}
                substatScaling={fullData.substatScaling}
                profile={fullData.profile}
                areStatsExpanded={areStatsExpanded}
                variant={usesProfileSidebar ? 'profile' : 'progression'}
              />
            </aside>

            <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
              <div className='shrink-0 px-5 pt-4 pb-0 md:pt-5'>
                {awakener.unreleased || isPreReleaseAwakener(awakener) ? (
                  <PreReleaseDataNotice />
                ) : null}
                <div className='flex items-center gap-2.5 pr-20'>
                  {cardAsset ? (
                    <button
                      aria-label={`View full art for ${displayName}`}
                      className={`h-14 w-14 shrink-0 overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 ${
                        isMobileHeader ? '' : 'hidden'
                      }`}
                      onClick={() => {
                        setIsArtViewerOpen(true)
                      }}
                      type='button'
                    >
                      {portrait ? (
                        <img
                          alt=''
                          className='h-full w-full object-cover object-top'
                          draggable={false}
                          src={portrait}
                        />
                      ) : (
                        <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
                      )}
                    </button>
                  ) : (
                    <div
                      className={`h-14 w-14 shrink-0 overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 ${
                        isMobileHeader ? '' : 'hidden'
                      }`}
                    >
                      {portrait ? (
                        <img
                          alt=''
                          className='h-full w-full object-cover object-top'
                          draggable={false}
                          src={portrait}
                        />
                      ) : (
                        <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
                      )}
                    </div>
                  )}
                  {!isMobileHeader ? (
                    <img alt='' className='size-11 shrink-0' draggable={false} src={realmIcon} />
                  ) : null}
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className='ui-title text-xl text-amber-100'>{displayName}</h3>
                      {isMobileHeader ? (
                        <img alt='' className='size-5 shrink-0' draggable={false} src={realmIcon} />
                      ) : null}
                    </div>
                    <p className='mt-0.5 text-xs text-slate-400'>
                      {headerMetaItems.map((item, index) => (
                        <span key={item.key}>
                          {index > 0 ? <span className='mx-1.5 text-slate-600'>·</span> : null}
                          <span style={item.color ? {color: item.color} : undefined}>
                            {item.label}
                          </span>
                        </span>
                      ))}
                    </p>
                    <DatabaseDetailTagStrip
                      className='mt-1.5 max-w-xl'
                      itemKey={awakener.id}
                      tags={awakener.tags}
                    />
                  </div>
                </div>
                <div className='mt-3 max-w-2xl'>
                  <div
                    aria-label='Awakener detail sections'
                    className='database-scrollbar flex min-w-0 flex-nowrap gap-0.5 overflow-x-auto'
                    role='tablist'
                  >
                    {DATABASE_AWAKENER_VISIBLE_TABS.map((tab) => (
                      <button
                        aria-controls={tabPanelId}
                        aria-selected={activeTab === tab}
                        className={`shrink-0 px-2 py-2 text-[10px] tracking-wide uppercase transition-colors sm:px-3.5 sm:text-[11px] ${
                          activeTab === tab
                            ? 'border-b-2 border-amber-200/70 text-amber-100'
                            : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                        id={`${tabsetId}-tab-${tab}`}
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab)
                        }}
                        onKeyDown={(event) => {
                          handleTabKeyDown(event, tab)
                        }}
                        ref={(element) => {
                          tabButtonRefs.current[tab] = element
                        }}
                        role='tab'
                        tabIndex={activeTab === tab ? 0 : -1}
                        type='button'
                      >
                        {DATABASE_AWAKENER_TAB_LABELS[tab]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className='mt-0 h-px w-3/4 bg-slate-700/50' />
              </div>

              <div
                className={`database-scrollbar flex-1 ${
                  activeTab === 'overview'
                    ? 'overflow-y-auto px-5 pt-0 pb-5 md:overflow-hidden md:p-5 md:pr-5 lg:pr-5'
                    : 'overflow-y-auto p-5 pr-8 lg:pr-16'
                }`}
              >
                {usesProfileSidebar ? null : (
                  <div className='mb-4 md:hidden'>
                    <AwakenerDetailSidebar
                      awakener={awakener}
                      compact
                      controls={resolvedControls}
                      onPatchSelection={sessionActions.patchSelection}
                      onStatsExpandedChange={setAreStatsExpanded}
                      scalingRecord={fullData}
                      selection={resolvedSelection}
                      stats={resolvedStats}
                      substatScaling={fullData.substatScaling}
                      areStatsExpanded={areStatsExpanded}
                    />
                  </div>
                )}

                <div
                  aria-labelledby={`${tabsetId}-tab-${activeTab}`}
                  className={activeTab === 'overview' ? 'h-full max-w-none' : 'max-w-2xl'}
                  id={tabPanelId}
                  role='tabpanel'
                  tabIndex={0}
                >
                  {activeTab === 'overview' && (
                    <AwakenerDetailOverview
                      awakener={awakener}
                      areStatsExpanded={areStatsExpanded}
                      fontScale={fontScale}
                      fullData={fullData}
                      onStatsExpandedChange={setAreStatsExpanded}
                      scalingRecord={fullData}
                      selection={resolvedSelection}
                      stats={resolvedStats}
                      substatScaling={fullData.substatScaling}
                    />
                  )}
                  {activeTab === 'upgrades' && (
                    <AwakenerDetailUpgrades
                      awakener={awakener}
                      fontScale={fontScale}
                      referenceLayer={referenceLayer}
                      shellView={shellView}
                      showTagIcons={sharedPreferences.showTagIcons}
                      showVisibleScaling={awakenerPreferences.showVisibleScaling}
                    />
                  )}
                  {activeTab === 'skills' && (
                    <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
                      <AwakenerDetailCards
                        onToggleEnlightenSlot={sessionActions.toggleEnlightenSlot}
                        referenceLayer={referenceLayer}
                        shellView={shellView}
                        showTagIcons={sharedPreferences.showTagIcons}
                        showVisibleScaling={awakenerPreferences.showVisibleScaling}
                      />
                    </Suspense>
                  )}
                  {activeTab === 'builds' && (
                    <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
                      <AwakenerBuildsTab awakenerId={awakener.id} />
                    </Suspense>
                  )}
                  {activeTab === 'lore' && (
                    <AwakenerDetailLore awakener={awakener} fullData={fullData} />
                  )}
                </div>
                <DatabasePopoverRoot {...popoverRootProps} fontScale={fontScale} />
              </div>
            </div>
          </div>
        </DatabasePopoverContext.Provider>
      </div>
      {isArtViewerOpen && cardAsset ? (
        <ArtViewerOverlay
          alt={fullArtAlt}
          onMount={suppressDetailEntitySearchCapture}
          onClose={() => {
            setIsArtViewerOpen(false)
          }}
          src={cardAsset}
        />
      ) : null}
    </DbDetailModalFrame>
  )
}
