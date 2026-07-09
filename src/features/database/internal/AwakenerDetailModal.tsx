import {
  lazy,
  Suspense,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
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
import {DatabaseDetailTagStrip} from './DatabaseDetailTagStrip'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from './font-scale'
import {useAwakenerDetailModalState} from './useAwakenerDetailModalState'
import {suppressDetailEntitySearchCapture} from './useDetailEntitySearch'
import {PopoverProvider} from './usePopoverStore'

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
type AwakenerDetailModalState = ReturnType<typeof useAwakenerDetailModalState>
type AwakenerDetailSessionActions = AwakenerDetailModalState['session']['actions']
type AwakenerDetailSessionPreferences = AwakenerDetailModalState['session']['preferences']
type AwakenerDetailSessionRuntime = AwakenerDetailModalState['session']['runtime']
type AwakenerDetailSettingsPanelProps = Parameters<typeof AwakenerDetailSettingsPanel>[0]
type AwakenerDetailFontScale = AwakenerDetailSessionPreferences['shared']['fontScale']
interface HeaderMetaItem {
  key: string
  label: string
  color?: string
}
interface AwakenerDetailActionChromeProps extends AwakenerDetailSettingsPanelProps {
  awakener: Awakener
  isSettingsOpen: boolean
  onClose: () => void
  onToggleSettings: () => void
  settingsRef: RefObject<HTMLDivElement | null>
}
function AwakenerDetailActionChrome({
  awakener,
  controls,
  isSettingsOpen,
  onClose,
  onPatchDefaultSelection,
  onToggleSettings,
  onUpdateAwakenerPreferences,
  onUpdateSharedPreferences,
  preferences,
  settingsRef,
  sharedPreferences,
}: AwakenerDetailActionChromeProps) {
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  return (
    <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
      {awakener.tags.length > 0 ? (
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
                itemKey={awakener.id}
                tags={awakener.tags}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        aria-expanded={isSettingsOpen}
        aria-label='Open detail settings'
        className='inline-flex size-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
        data-detail-settings-trigger=''
        onClick={onToggleSettings}
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
          controls={controls}
          onPatchDefaultSelection={onPatchDefaultSelection}
          onUpdateAwakenerPreferences={onUpdateAwakenerPreferences}
          onUpdateSharedPreferences={onUpdateSharedPreferences}
          preferences={preferences}
          sharedPreferences={sharedPreferences}
        />
      ) : null}
    </div>
  )
}
interface AwakenerDetailTabsProps {
  activeTab: DatabaseAwakenerTab
  onTabChange: (tab: DatabaseAwakenerVisibleTab) => void
  tabPanelId: string
  tabsetId: string
}
function AwakenerDetailTabs({
  activeTab,
  onTabChange,
  tabPanelId,
  tabsetId,
}: AwakenerDetailTabsProps) {
  const tabButtonRefs = useRef<
    Partial<Record<DatabaseAwakenerVisibleTab, HTMLButtonElement | null>>
  >({})
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
    onTabChange(nextTab)
    focusTab(nextTab)
  }
  return (
    <div
      aria-label='Awakener detail sections'
      className='database-scrollbar flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto'
      role='tablist'
    >
      {DATABASE_AWAKENER_VISIBLE_TABS.map((tab) => (
        <button
          aria-controls={tabPanelId}
          aria-selected={activeTab === tab}
          className={`flex-1 shrink-0 px-2 py-2 text-center text-[10px] tracking-wide uppercase transition-colors sm:px-3.5 sm:text-[11px] ${
            activeTab === tab
              ? 'border-b-2 border-amber-200/70 text-amber-100'
              : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id={`${tabsetId}-tab-${tab}`}
          key={tab}
          onClick={() => {
            onTabChange(tab)
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
  )
}
interface AwakenerDetailMobilePortraitProps {
  cardAsset: string | undefined
  displayName: string
  isMobileHeader: boolean
  onOpenFullArt: () => void
  portrait: string | undefined
}
function AwakenerDetailMobilePortrait({
  cardAsset,
  displayName,
  isMobileHeader,
  onOpenFullArt,
  portrait,
}: AwakenerDetailMobilePortraitProps) {
  const className = `h-14 w-14 shrink-0 overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 ${
    isMobileHeader ? '' : 'hidden'
  }`
  const portraitContent = portrait ? (
    <img
      alt=''
      className='h-full w-full object-cover object-top'
      draggable={false}
      src={portrait}
    />
  ) : (
    <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
  )
  return cardAsset ? (
    <button
      aria-label={`View full art for ${displayName}`}
      className={className}
      onClick={onOpenFullArt}
      type='button'
    >
      {portraitContent}
    </button>
  ) : (
    <div className={className}>{portraitContent}</div>
  )
}
interface AwakenerDetailHeaderProps {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  cardAsset: string | undefined
  displayName: string
  headerMetaItems: HeaderMetaItem[]
  isMobileHeader: boolean
  onOpenFullArt: () => void
  onTabChange: (tab: DatabaseAwakenerVisibleTab) => void
  portrait: string | undefined
  realmIcon: string | undefined
  tabPanelId: string
  tabsetId: string
}
function AwakenerDetailHeader({
  activeTab,
  awakener,
  cardAsset,
  displayName,
  headerMetaItems,
  isMobileHeader,
  onOpenFullArt,
  onTabChange,
  portrait,
  realmIcon,
  tabPanelId,
  tabsetId,
}: AwakenerDetailHeaderProps) {
  return (
    <div className='shrink-0 pt-4 pr-5 pb-0 pl-5 md:pt-5 md:pl-3'>
      {awakener.unreleased || isPreReleaseAwakener(awakener) ? <PreReleaseDataNotice /> : null}
      <div className='flex items-center gap-2.5'>
        <AwakenerDetailMobilePortrait
          cardAsset={cardAsset}
          displayName={displayName}
          isMobileHeader={isMobileHeader}
          onOpenFullArt={onOpenFullArt}
          portrait={portrait}
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 pr-24 sm:pr-28'>
            <h3 className='ui-title text-3xl font-bold tracking-wide text-amber-100 sm:text-4xl'>
              {displayName}
            </h3>
          </div>
          <p className='mt-1 flex flex-wrap items-center gap-y-1 pr-16 text-sm font-medium text-slate-300 sm:pr-0 sm:text-base'>
            {headerMetaItems.map((item, index) => (
              <span key={item.key} className='inline-flex items-center'>
                <span className='inline-flex items-center gap-1.5'>
                  {item.key === 'realm' && realmIcon ? (
                    <img
                      alt=''
                      className='size-4 shrink-0 sm:size-5'
                      draggable={false}
                      src={realmIcon}
                    />
                  ) : null}
                  <span style={item.color ? {color: item.color} : undefined}>{item.label}</span>
                </span>
                {index < headerMetaItems.length - 1 ? (
                  <span className='mx-1.5 text-slate-600 select-none'>·</span>
                ) : null}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className='mt-4 w-full'>
        <AwakenerDetailTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          tabPanelId={tabPanelId}
          tabsetId={tabsetId}
        />
      </div>
    </div>
  )
}
interface AwakenerDetailTabPanelContentProps {
  activeTab: DatabaseAwakenerTab
  areStatsExpanded: boolean
  awakener: Awakener
  fontScale: AwakenerDetailFontScale
  fullData: AwakenerFullRecord
  onStatsExpandedChange: (isExpanded: boolean) => void
  sessionActions: AwakenerDetailSessionActions
  sessionPreferences: AwakenerDetailSessionPreferences
  sessionRuntime: AwakenerDetailSessionRuntime
}
function AwakenerDetailTabPanelContent({
  activeTab,
  areStatsExpanded,
  awakener,
  fontScale,
  fullData,
  onStatsExpandedChange,
  sessionActions,
  sessionPreferences,
  sessionRuntime,
}: AwakenerDetailTabPanelContentProps) {
  const {awakener: awakenerPreferences, shared: sharedPreferences} = sessionPreferences
  const {referenceLayer, resolvedSelection, resolvedStats, shellView} = sessionRuntime
  switch (activeTab) {
    case 'overview':
      return (
        <AwakenerDetailOverview
          awakener={awakener}
          areStatsExpanded={areStatsExpanded}
          fontScale={fontScale}
          fullData={fullData}
          onStatsExpandedChange={onStatsExpandedChange}
          scalingRecord={fullData}
          selection={resolvedSelection}
          stats={resolvedStats}
          substatScaling={fullData.substatScaling}
        />
      )
    case 'upgrades':
      return (
        <AwakenerDetailUpgrades
          awakener={awakener}
          fontScale={fontScale}
          referenceLayer={referenceLayer}
          shellView={shellView}
          showTagIcons={sharedPreferences.showTagIcons}
          showVisibleScaling={awakenerPreferences.showVisibleScaling}
        />
      )
    case 'skills':
      return (
        <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
          <AwakenerDetailCards
            onToggleEnlightenSlot={sessionActions.toggleEnlightenSlot}
            referenceLayer={referenceLayer}
            shellView={shellView}
            showTagIcons={sharedPreferences.showTagIcons}
            showVisibleScaling={awakenerPreferences.showVisibleScaling}
          />
        </Suspense>
      )
    case 'builds':
      return (
        <Suspense fallback={TAB_CONTENT_LOADING_FALLBACK}>
          <AwakenerBuildsTab awakenerId={awakener.id} />
        </Suspense>
      )
    case 'lore':
      return <AwakenerDetailLore awakener={awakener} fullData={fullData} />
    case 'teams':
      return null
  }
}
interface AwakenerDetailBodyProps {
  activeTab: DatabaseAwakenerTab
  areStatsExpanded: boolean
  awakener: Awakener
  cardAsset: string | undefined
  displayName: string
  fontScale: AwakenerDetailFontScale
  fullData: AwakenerFullRecord
  headerMetaItems: HeaderMetaItem[]
  isMobileHeader: boolean
  onOpenFullArt: () => void
  onStatsExpandedChange: (isExpanded: boolean) => void
  onTabChange: (tab: DatabaseAwakenerVisibleTab) => void
  portrait: string | undefined
  realmIcon: string | undefined
  sessionActions: AwakenerDetailSessionActions
  sessionPreferences: AwakenerDetailSessionPreferences
  sessionRuntime: AwakenerDetailSessionRuntime
  tabPanelId: string
  tabsetId: string
}
function AwakenerDetailBody({
  activeTab,
  areStatsExpanded,
  awakener,
  cardAsset,
  displayName,
  fontScale,
  fullData,
  headerMetaItems,
  isMobileHeader,
  onOpenFullArt,
  onStatsExpandedChange,
  onTabChange,
  portrait,
  realmIcon,
  sessionActions,
  sessionPreferences,
  sessionRuntime,
  tabPanelId,
  tabsetId,
}: AwakenerDetailBodyProps) {
  const {resolvedControls, resolvedSelection, resolvedStats} = sessionRuntime
  const usesProfileSidebar = activeTab === 'overview' || activeTab === 'lore'
  return (
    <div className='flex min-h-0 flex-1'>
      <aside className='database-scrollbar hidden w-56 shrink-0 overflow-y-auto py-4 pr-2 pl-4 md:block lg:w-64'>
        <AwakenerDetailSidebar
          awakener={awakener}
          areStatsExpanded={areStatsExpanded}
          controls={resolvedControls}
          onOpenFullArt={cardAsset ? onOpenFullArt : undefined}
          onPatchSelection={sessionActions.patchSelection}
          onStatsExpandedChange={onStatsExpandedChange}
          profile={fullData.profile}
          scalingRecord={fullData}
          selection={resolvedSelection}
          stats={resolvedStats}
          substatScaling={fullData.substatScaling}
          variant={usesProfileSidebar ? 'profile' : 'progression'}
        />
      </aside>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <AwakenerDetailHeader
          activeTab={activeTab}
          awakener={awakener}
          cardAsset={cardAsset}
          displayName={displayName}
          headerMetaItems={headerMetaItems}
          isMobileHeader={isMobileHeader}
          onOpenFullArt={onOpenFullArt}
          onTabChange={onTabChange}
          portrait={portrait}
          realmIcon={realmIcon}
          tabPanelId={tabPanelId}
          tabsetId={tabsetId}
        />
        <div
          className={`database-scrollbar flex-1 ${
            activeTab === 'overview'
              ? 'overflow-y-auto px-5 pt-0 pb-5 md:overflow-hidden md:p-5 md:pr-5 md:pl-3 lg:pr-5'
              : 'overflow-y-auto p-5 pl-5 md:pl-3'
          }`}
        >
          {usesProfileSidebar ? null : (
            <div className='mb-4 md:hidden'>
              <AwakenerDetailSidebar
                awakener={awakener}
                areStatsExpanded={areStatsExpanded}
                compact
                controls={resolvedControls}
                onPatchSelection={sessionActions.patchSelection}
                onStatsExpandedChange={onStatsExpandedChange}
                scalingRecord={fullData}
                selection={resolvedSelection}
                stats={resolvedStats}
                substatScaling={fullData.substatScaling}
              />
            </div>
          )}
          <div
            aria-labelledby={`${tabsetId}-tab-${activeTab}`}
            className={activeTab === 'overview' ? 'h-full max-w-none' : 'max-w-none'}
            id={tabPanelId}
            role='tabpanel'
            tabIndex={0}
          >
            <AwakenerDetailTabPanelContent
              activeTab={activeTab}
              areStatsExpanded={areStatsExpanded}
              awakener={awakener}
              fontScale={fontScale}
              fullData={fullData}
              onStatsExpandedChange={onStatsExpandedChange}
              sessionActions={sessionActions}
              sessionPreferences={sessionPreferences}
              sessionRuntime={sessionRuntime}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
function AwakenerDetailModalInner({
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
  const [isArtViewerOpen, setIsArtViewerOpen] = useState(false)
  const [areStatsExpanded, setAreStatsExpanded] = useState(false)
  const tabsetId = useId()
  const {
    activeSearchIndex,
    activeTab,
    handleModalCancel,
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
  const {resolvedControls} = sessionRuntime
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
  return (
    <DbDetailModalFrame
      ariaLabel={`${displayName} details`}
      header={
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
      onCancel={handleModalCancel}
      panelRef={panelRef}
      shellStyle={getDescriptionFontScaleStyle(fontScale)}
    >
      <div className='relative flex min-h-0 flex-auto overflow-hidden border border-amber-200/55 bg-slate-950/[.97] shadow-[0_18px_50px_rgba(2,6,23,0.72)]'>
        <AwakenerDetailActionChrome
          key={awakener.id}
          awakener={awakener}
          controls={resolvedControls}
          isSettingsOpen={isSettingsOpen}
          onClose={onClose}
          onPatchDefaultSelection={sessionActions.patchDefaultSelection}
          onToggleSettings={() => {
            setIsSettingsOpen((previous) => !previous)
          }}
          onUpdateAwakenerPreferences={sessionActions.updateAwakenerPreferences}
          onUpdateSharedPreferences={sessionActions.updateSharedPreferences}
          preferences={awakenerPreferences}
          settingsRef={settingsRef}
          sharedPreferences={sharedPreferences}
        />
        <AwakenerDetailBody
          activeTab={activeTab}
          areStatsExpanded={areStatsExpanded}
          awakener={awakener}
          cardAsset={cardAsset}
          displayName={displayName}
          fontScale={fontScale}
          fullData={fullData}
          headerMetaItems={headerMetaItems}
          isMobileHeader={isMobileHeader}
          onOpenFullArt={() => {
            setIsArtViewerOpen(true)
          }}
          onStatsExpandedChange={setAreStatsExpanded}
          onTabChange={setActiveTab}
          portrait={portrait}
          realmIcon={realmIcon}
          sessionActions={sessionActions}
          sessionPreferences={sessionPreferences}
          sessionRuntime={sessionRuntime}
          tabPanelId={tabPanelId}
          tabsetId={tabsetId}
        />
        <Suspense fallback={null}>
          <DatabasePopoverRoot {...popoverRootProps} />
        </Suspense>
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

export function AwakenerDetailModal(props: AwakenerDetailModalProps) {
  return (
    <PopoverProvider>
      <AwakenerDetailModalInner {...props} />
    </PopoverProvider>
  )
}
