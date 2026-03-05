import { useRef } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAwakeners } from '../domain/awakeners'
import { buildDatabaseAwakenerPath, findAwakenerByDatabaseSlug } from '../domain/database-paths'
import { DatabaseFilters } from './database/DatabaseFilters'
import { DatabaseGrid } from './database/DatabaseGrid'
import { AwakenerDetailModal } from './database/AwakenerDetailModal'
import { useDatabaseViewModel } from './database/useDatabaseViewModel'
import { useGlobalCollectionSearchCapture } from './collection/useGlobalCollectionSearchCapture'
import emojiWke from '../assets/emoji/Emoji_WKE_S_06.png'

export function DatabasePage() {
  const vm = useDatabaseViewModel()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const { awakenerSlug } = useParams<{ awakenerSlug?: string }>()
  const selectedAwakener = findAwakenerByDatabaseSlug(getAwakeners(), awakenerSlug)

  useGlobalCollectionSearchCapture({
    searchInputRef,
    onAppendCharacter: vm.appendSearchCharacter,
    onClearSearch: vm.clearQuery,
  })

  useEffect(() => {
    if (!awakenerSlug || selectedAwakener) {
      return
    }
    void navigate('/database', { replace: true })
  }, [awakenerSlug, navigate, selectedAwakener])

  function openAwakenerDetail(awakenerId: number) {
    const awakener = getAwakeners().find((entry) => entry.id === awakenerId)
    if (!awakener) {
      return
    }
    void navigate(buildDatabaseAwakenerPath(awakener), { replace: true })
  }

  function closeDetail() {
    void navigate('/database', { replace: true })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5 border border-amber-500/30 bg-amber-950/20 px-3 py-2.5">
        <img
          alt=""
          aria-hidden
          className="h-12 w-12 shrink-0 -scale-x-100 object-contain"
          src={emojiWke}
        />
        <p className="text-[11px] leading-relaxed text-amber-100/75">
          <strong className="font-semibold text-amber-200/90">Work in Progress:</strong> This database is still being built! Expect improvements to functionality, styling and Yes(!) the popup is very ugly and needs big work. Thanks for your patience!
        </p>
      </div>

      <DatabaseFilters
        filteredCount={vm.awakeners.length}
        groupByRealm={vm.groupByRealm}
        onGroupByRealmChange={vm.setGroupByRealm}
        onQueryChange={vm.setQuery}
        onRarityFilterChange={vm.setRarityFilter}
        onRealmFilterChange={vm.setRealmFilter}
        onSortDirectionToggle={vm.toggleSortDirection}
        onSortKeyChange={vm.setSortKey}
        onTypeFilterChange={vm.setTypeFilter}
        query={vm.query}
        rarityFilter={vm.rarityFilter}
        realmFilter={vm.realmFilter}
        searchInputRef={searchInputRef}
        sortDirection={vm.sortDirection}
        sortKey={vm.sortKey}
        totalCount={vm.totalCount}
        typeFilter={vm.typeFilter}
      />

      <DatabaseGrid
        awakeners={vm.awakeners}
        onSelectAwakener={openAwakenerDetail}
      />

      {selectedAwakener ? (
        <AwakenerDetailModal
          awakener={selectedAwakener}
          key={selectedAwakener.id}
          onClose={closeDetail}
        />
      ) : null}
    </section>
  )
}
