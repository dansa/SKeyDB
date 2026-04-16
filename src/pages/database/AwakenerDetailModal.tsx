import {lazy, Suspense, useId, useRef, type KeyboardEvent as ReactKeyboardEvent} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {type Awakener} from '@/domain/awakeners'
import {type AwakenerFullV2Record} from '@/domain/awakeners-full-v2'
import {DATABASE_AWAKENER_TABS, type DatabaseAwakenerTab} from '@/domain/database-paths'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {AwakenerDetailOverview} from './AwakenerDetailOverview'
import {AwakenerDetailSearchBar} from './AwakenerDetailSearchBar'
import {AwakenerDetailSettingsPanel} from './AwakenerDetailSettingsPanel'
import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {DatabasePopoverContext} from './database-popover-context'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from './font-scale'
import {useAwakenerDetailModalState} from './useAwakenerDetailModalState'

interface AwakenerDetailModalProps {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  fullDataV2: AwakenerFullV2Record
  onClose: () => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
}

const DATABASE_AWAKENER_TAB_LABELS: Record<DatabaseAwakenerTab, string> = {
  overview: 'Overview',
  cards: 'Cards',
  builds: 'Builds',
  teams: 'Teams',
}

const TAB_CONTENT_LOADING_FALLBACK = (
  <div className='py-3 text-sm text-slate-300'>Loading tab...</div>
)

const AwakenerDetailCards = lazy(() =>
  import('./AwakenerDetailCards').then((module) => ({default: module.AwakenerDetailCards})),
)
const AwakenerBuildsTab = lazy(() =>
  import('./AwakenerBuildsTab').then((module) => ({default: module.AwakenerBuildsTab})),
)
const AwakenerTeamsTab = lazy(() =>
  import('./AwakenerTeamsTab').then((module) => ({default: module.AwakenerTeamsTab})),
)

export function AwakenerDetailModal({
  activeTab: routeActiveTab,
  awakener,
  awakeners,
  fullDataV2,
  onClose,
  onTabChange,
  onSelectAwakener,
}: AwakenerDetailModalProps) {
  const tabButtonRefs = useRef<Partial<Record<DatabaseAwakenerTab, HTMLButtonElement | null>>>({})
  const tabsetId = useId()
  const {
    activeSearchIndex,
    activeTab,
    canExpandTags,
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
    setShowAllTags,
    session,
    settingsRef,
    showAllTags,
    tagsRef,
  } = useAwakenerDetailModalState({
    activeTab: routeActiveTab,
    awakener,
    awakeners,
    fullDataV2,
    onClose,
    onSelectAwakener,
    onTabChange,
  })
  const {
    actions: sessionActions,
    preferences: sessionPreferences,
    runtime: sessionRuntime,
  } = session
  const {defaultSelection, fontScale, value: preferences} = sessionPreferences
  const {referenceLayer, resolvedControls, resolvedSelection, resolvedStats, shellView} =
    sessionRuntime

  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmTint = getRealmTint(awakener.realm)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const portrait = getAwakenerPortraitAsset(awakener.name)
  const tabPanelId = `${tabsetId}-panel`

  function focusTab(tab: DatabaseAwakenerTab) {
    tabButtonRefs.current[tab]?.focus()
  }

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentTab: DatabaseAwakenerTab,
  ) {
    const currentIndex = DATABASE_AWAKENER_TABS.indexOf(currentTab)
    if (currentIndex === -1) {
      return
    }

    let nextTab: DatabaseAwakenerTab | null = null
    if (event.key === 'ArrowRight') {
      nextTab = DATABASE_AWAKENER_TABS[(currentIndex + 1) % DATABASE_AWAKENER_TABS.length]
    } else if (event.key === 'ArrowLeft') {
      nextTab =
        DATABASE_AWAKENER_TABS[
          (currentIndex - 1 + DATABASE_AWAKENER_TABS.length) % DATABASE_AWAKENER_TABS.length
        ]
    } else if (event.key === 'Home') {
      nextTab = DATABASE_AWAKENER_TABS[0]
    } else if (event.key === 'End') {
      nextTab = DATABASE_AWAKENER_TABS[DATABASE_AWAKENER_TABS.length - 1]
    }

    if (!nextTab) {
      return
    }

    event.preventDefault()
    setActiveTab(nextTab)
    focusTab(nextTab)
  }

  return (
    <div
      className='fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/65 p-4 md:p-6 lg:p-10'
      onClick={handleOverlayClick}
    >
      <div
        className='relative z-[901] flex h-full max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col gap-2.5 md:max-h-[calc(100dvh-3rem)] md:gap-3 lg:max-h-[calc(100dvh-5rem)]'
        data-detail-modal-shell=''
        onKeyDown={handlePanelKeyDown}
      >
        <div className='shrink-0'>
          <AwakenerDetailSearchBar
            activeIndex={activeSearchIndex}
            containerRef={searchContainerRef}
            inputRef={searchInputRef}
            isOpen={isSearchOpen}
            onInputKeyDown={handleSearchInputKeyDown}
            onInputFocus={() => {
              openSearch()
            }}
            onQueryChange={handleSearchQueryChange}
            onSelectAwakener={handleSelectAwakenerFromSearch}
            query={searchQuery}
            results={searchResults}
          />
        </div>
        <div
          aria-label={`${displayName} details`}
          aria-modal='true'
          className='relative flex min-h-0 flex-1 overflow-hidden border border-amber-200/55 bg-slate-950/[.97] shadow-[0_18px_50px_rgba(2,6,23,0.72)]'
          ref={panelRef}
          role='dialog'
          style={getDescriptionFontScaleStyle(fontScale)}
          tabIndex={-1}
        >
          <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
            <button
              aria-expanded={isSettingsOpen}
              aria-label='Open detail settings'
              className='inline-flex h-8 w-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100'
              data-detail-settings-trigger=''
              onClick={() => {
                setIsSettingsOpen((previous) => !previous)
              }}
              type='button'
            >
              <FaGear className='h-3.5 w-3.5' />
            </button>
            <button
              aria-label='Close detail'
              className='inline-flex h-8 w-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100'
              onClick={onClose}
              type='button'
            >
              <FaXmark className='h-4 w-4' />
            </button>
            {isSettingsOpen ? (
              <AwakenerDetailSettingsPanel
                controls={resolvedControls}
                defaultSelection={defaultSelection}
                onPatchDefaultSelection={sessionActions.patchDefaultSelection}
                onUpdatePreferences={sessionActions.updatePreferences}
                preferences={preferences}
              />
            ) : null}
          </div>
          <DatabasePopoverContext.Provider value={popoverContextValue}>
            <div className='flex min-h-0 flex-1'>
              <aside className='database-scrollbar hidden w-56 shrink-0 overflow-y-auto border-r border-slate-700/40 p-4 md:block lg:w-64'>
                <AwakenerDetailSidebar
                  awakener={awakener}
                  controls={resolvedControls}
                  onPatchSelection={sessionActions.patchSelection}
                  scalingRecord={fullDataV2}
                  selection={resolvedSelection}
                  stats={resolvedStats}
                  substatScaling={fullDataV2.substatScaling}
                />
              </aside>

              <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
                <div className='shrink-0 px-5 pt-4 pb-0 md:pt-5'>
                  {awakener.unreleased ? (
                    <div className='mb-3 max-w-2xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
                      <p className='text-[11px] leading-relaxed text-amber-100/75'>
                        <strong className='font-semibold text-amber-200/90'>
                          Pre-release data:
                        </strong>{' '}
                        Values and content are based on pre-release information and may change
                        before or after release.
                      </p>
                    </div>
                  ) : null}
                  <div className='flex items-center gap-2.5 pr-14'>
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
                    {!isMobileHeader ? (
                      <img
                        alt=''
                        className='h-11 w-11 shrink-0'
                        draggable={false}
                        src={realmIcon}
                      />
                    ) : null}
                    <div>
                      <div className='flex items-center gap-2'>
                        <h3 className='ui-title text-xl text-amber-100'>{displayName}</h3>
                        {isMobileHeader ? (
                          <img
                            alt=''
                            className='h-5 w-5 shrink-0'
                            draggable={false}
                            src={realmIcon}
                          />
                        ) : null}
                      </div>
                      <p className='mt-0.5 text-xs text-slate-400'>
                        <span style={{color: realmTint}}>{realmLabel}</span>
                        <span className='mx-1.5 text-slate-600'>·</span>
                        <span>
                          {awakener.type
                            ? awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()
                            : '—'}
                        </span>
                        <span className='mx-1.5 text-slate-600'>·</span>
                        <span>{awakener.faction}</span>
                      </p>
                      {awakener.tags.length > 0 ? (
                        <div className='mt-1.5 max-w-xl'>
                          <div
                            className={`flex flex-wrap gap-1 overflow-hidden md:overflow-visible ${
                              showAllTags
                                ? 'max-h-[18rem] md:max-h-none'
                                : 'max-h-[46px] md:max-h-none'
                            }`}
                            ref={tagsRef}
                          >
                            {awakener.tags.map((tag) => (
                              <span
                                className='border border-slate-600/40 bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-400'
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {canExpandTags ? (
                            <button
                              aria-expanded={showAllTags}
                              className='mt-1 text-[10px] text-slate-500 transition-colors hover:text-slate-300 md:hidden'
                              onClick={() => {
                                setShowAllTags((prev) => !prev)
                              }}
                              type='button'
                            >
                              {showAllTags ? 'Show fewer tags' : 'Show all tags'}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className='mt-3 max-w-2xl'>
                    <nav
                      aria-label='Awakener detail sections'
                      className='flex min-w-0 flex-wrap gap-0.5'
                      role='tablist'
                    >
                      {DATABASE_AWAKENER_TABS.map((tab) => (
                        <button
                          aria-controls={tabPanelId}
                          aria-selected={activeTab === tab}
                          className={`px-3.5 py-2 text-[11px] tracking-wide uppercase transition-colors ${
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
                    </nav>
                  </div>
                  <div className='mt-0 h-px w-3/4 bg-slate-700/50' />
                </div>

                <div className='database-scrollbar flex-1 overflow-y-auto p-5 pr-8 lg:pr-16'>
                  <div className='mb-4 md:hidden'>
                    <AwakenerDetailSidebar
                      awakener={awakener}
                      compact
                      controls={resolvedControls}
                      onPatchSelection={sessionActions.patchSelection}
                      scalingRecord={fullDataV2}
                      selection={resolvedSelection}
                      stats={resolvedStats}
                      substatScaling={fullDataV2.substatScaling}
                    />
                  </div>

                  <div
                    aria-labelledby={`${tabsetId}-tab-${activeTab}`}
                    className='max-w-2xl'
                    id={tabPanelId}
                    role='tabpanel'
                    tabIndex={0}
                  >
                    {activeTab === 'overview' && (
                      <AwakenerDetailOverview
                        awakener={awakener}
                        fontScale={fontScale}
                        referenceLayer={referenceLayer}
                        shellView={shellView}
                        showTagIcons={preferences.showTagIcons}
                        showVisibleScaling={preferences.showVisibleScaling}
                      />
                    )}
                    {activeTab === 'cards' && (
                      <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
                        <AwakenerDetailCards
                          onToggleEnlightenSlot={sessionActions.toggleEnlightenSlot}
                          referenceLayer={referenceLayer}
                          shellView={shellView}
                          showTagIcons={preferences.showTagIcons}
                          showVisibleScaling={preferences.showVisibleScaling}
                        />
                      </Suspense>
                    )}
                    {activeTab === 'builds' && (
                      <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
                        <AwakenerBuildsTab awakenerId={awakener.id} />
                      </Suspense>
                    )}
                    {activeTab === 'teams' && (
                      <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
                        <AwakenerTeamsTab />
                      </Suspense>
                    )}
                  </div>
                  <DatabasePopoverRoot {...popoverRootProps} fontScale={fontScale} />
                </div>
              </div>
            </div>
          </DatabasePopoverContext.Provider>
        </div>
      </div>
    </div>
  )
}
