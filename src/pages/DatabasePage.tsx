import {cache, lazy, Suspense, use, useEffect, useRef} from 'react'

import {useLocation, useNavigate, useParams} from 'react-router-dom'

import emojiWke from '@/assets/emoji/Emoji_WKE_S_06.webp'
import {getAwakeners, type Awakener} from '@/domain/awakeners'
import {loadAwakenerFullV2ById} from '@/domain/awakeners-full-v2-loader'
import {
  buildDatabaseAwakenerPath,
  findAwakenerByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'

import {DatabaseFilters} from './database/DatabaseFilters'
import {DatabaseGrid} from './database/DatabaseGrid'
import {useDatabaseBrowseState} from './database/useDatabaseBrowseState'
import {useDatabaseViewModel} from './database/useDatabaseViewModel'
import {useGlobalSearchCapture} from './useGlobalSearchCapture'

const AwakenerDetailModal = lazy(() =>
  import('./database/AwakenerDetailModal').then((module) => ({
    default: module.AwakenerDetailModal,
  })),
)
const databaseAwakeners = getAwakeners()
const loadAwakenerFullV2ForSuspense = cache(loadAwakenerFullV2ById)

export function DatabasePage() {
  const browseState = useDatabaseBrowseState()
  const vm = useDatabaseViewModel(databaseAwakeners, browseState)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const {awakenerSlug, tabSlug} = useParams<{awakenerSlug?: string; tabSlug?: string}>()
  const selectedAwakener = findAwakenerByDatabaseSlug(databaseAwakeners, awakenerSlug)
  const selectedTab = resolveDatabaseAwakenerTab(tabSlug) ?? 'overview'

  useGlobalSearchCapture({
    enabled: !selectedAwakener,
    searchInputRef,
    onAppendCharacter: browseState.appendSearchCharacter,
    onRemoveCharacter: browseState.removeSearchCharacter,
    onClearSearch: browseState.clearQuery,
  })

  useEffect(() => {
    if (awakenerSlug && !selectedAwakener) {
      void navigate({pathname: '/database', search: location.search}, {replace: true})
    }
  }, [awakenerSlug, location.search, navigate, selectedAwakener])

  function openAwakenerDetail(awakenerId: number) {
    const awakener = databaseAwakeners.find((entry) => entry.id === awakenerId)
    if (!awakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(awakener),
      search: location.search,
    })
  }

  function closeDetail() {
    void navigate({pathname: '/database', search: location.search})
  }

  function handleDetailTabChange(nextTab: DatabaseAwakenerTab) {
    if (!selectedAwakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(selectedAwakener, nextTab),
      search: location.search,
    })
  }

  function handleModalAwakenerSelect(nextAwakener: Awakener, nextTab: DatabaseAwakenerTab) {
    void navigate({
      pathname: buildDatabaseAwakenerPath(nextAwakener, nextTab),
      search: location.search,
    })
  }

  return (
    <section className='space-y-3'>
      <div className='flex items-center gap-2.5 border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
        <img
          alt=''
          aria-hidden
          className='h-12 w-12 shrink-0 -scale-x-100 object-contain'
          src={emojiWke}
        />
        <p className='text-[11px] leading-relaxed text-amber-100/75'>
          <strong className='font-semibold text-amber-200/90'>Work in Progress:</strong> This
          database is still being built! Expect improvements to functionality, styling and Yes(!)
          the popup is very ugly and needs big work. Thanks for your patience!
        </p>
      </div>

      <DatabaseFilters
        filteredCount={vm.awakeners.length}
        groupByRealm={browseState.groupByRealm}
        onGroupByRealmChange={browseState.setGroupByRealm}
        onQueryChange={browseState.setQuery}
        onRarityFilterChange={browseState.setRarityFilter}
        onRealmFilterChange={browseState.setRealmFilter}
        onSortDirectionToggle={browseState.toggleSortDirection}
        onSortKeyChange={browseState.setSortKey}
        onTypeFilterChange={browseState.setTypeFilter}
        query={browseState.query}
        rarityFilter={browseState.rarityFilter}
        realmFilter={browseState.realmFilter}
        searchInputRef={searchInputRef}
        sortDirection={browseState.sortDirection}
        sortKey={browseState.sortKey}
        totalCount={vm.totalCount}
        typeFilter={browseState.typeFilter}
      />

      <DatabaseGrid awakeners={vm.awakeners} onSelectAwakener={openAwakenerDetail} />

      {selectedAwakener ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading awakener details...</div>
          }
        >
          <DatabaseAwakenerDetailRoute
            activeTab={selectedTab}
            awakener={selectedAwakener}
            awakeners={databaseAwakeners}
            onClose={closeDetail}
            onSelectAwakener={handleModalAwakenerSelect}
            onTabChange={handleDetailTabChange}
            tabSlug={tabSlug}
          />
        </Suspense>
      ) : null}
    </section>
  )
}

interface DatabaseAwakenerDetailRouteProps {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  onClose: () => void
  onSelectAwakener: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
  tabSlug?: string
}

function DatabaseAwakenerDetailRoute({
  activeTab,
  awakener,
  awakeners,
  onClose,
  onSelectAwakener,
  onTabChange,
  tabSlug,
}: DatabaseAwakenerDetailRouteProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const fullDataV2 = use(loadAwakenerFullV2ForSuspense(awakener.id)) ?? null

  useEffect(() => {
    if (!fullDataV2) {
      void navigate({pathname: '/database', search: location.search}, {replace: true})
      return
    }
    if (!tabSlug || resolveDatabaseAwakenerTab(tabSlug)) {
      return
    }
    void navigate(
      {
        pathname: buildDatabaseAwakenerPath(awakener),
        search: location.search,
      },
      {replace: true},
    )
  }, [awakener, fullDataV2, location.search, navigate, tabSlug])

  if (!fullDataV2) {
    return null
  }

  return (
    <AwakenerDetailModal
      activeTab={activeTab}
      awakener={awakener}
      awakeners={awakeners}
      fullDataV2={fullDataV2}
      key={awakener.id}
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
      onTabChange={onTabChange}
    />
  )
}
