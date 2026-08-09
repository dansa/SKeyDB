import {useCallback} from 'react'

import {useGlobalSearchCapture} from '@/ui/search/useGlobalSearchCapture'

import type {EntityBrowseController, EntitySearchActions} from './useEntityBrowseController'

export function useActiveGlobalSearchCapture(
  controller: EntityBrowseController,
  searchActions: EntitySearchActions,
) {
  useGlobalSearchCapture({
    enabled: !controller.isDetailOpen,
    searchInputRef: controller.searchInputRef,
    onAppendCharacter: searchActions.appendSearchCharacter,
    onRemoveCharacter: searchActions.removeSearchCharacter,
    onClearSearch: searchActions.clearQuery,
  })
}

export function useEntityDetailActions<TEntry extends {id: string}>(
  entries: readonly TEntry[],
  buildPath: (entry: TEntry) => string,
  detailKind: Parameters<EntityBrowseController['preloadDetail']>[0],
  controller: EntityBrowseController,
) {
  const {openDetail: navigateToDetail, preloadDetail: preloadDetailResource} = controller
  const openDetail = useCallback(
    (entryId: string) => {
      const entry = entries.find((candidate) => candidate.id === entryId)
      if (entry) {
        navigateToDetail(buildPath(entry))
      }
    },
    [buildPath, entries, navigateToDetail],
  )
  const preloadDetail = useCallback(
    (entryId: string) => {
      preloadDetailResource(detailKind, entryId)
    },
    [detailKind, preloadDetailResource],
  )

  return {openDetail, preloadDetail}
}
