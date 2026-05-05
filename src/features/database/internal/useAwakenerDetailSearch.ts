import {useCallback} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {type DatabaseAwakenerTab} from '@/domain/database-paths'

import {useDetailEntitySearch} from './useDetailEntitySearch'

interface UseAwakenerDetailSearchOptions {
  activeTab: DatabaseAwakenerTab
  awakeners: Awakener[]
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
}

export function useAwakenerDetailSearch({
  activeTab,
  awakeners,
  onSelectAwakener,
}: UseAwakenerDetailSearchOptions) {
  const handleSelectAwakenerFromSearch = useCallback(
    (nextAwakener: Awakener) => {
      onSelectAwakener?.(nextAwakener, activeTab)
    },
    [activeTab, onSelectAwakener],
  )

  return {
    ...useDetailEntitySearch({
      items: awakeners,
      onSelectResult: handleSelectAwakenerFromSearch,
      searchItems: searchAwakeners,
    }),
    handleSelectAwakenerFromSearch,
  }
}
