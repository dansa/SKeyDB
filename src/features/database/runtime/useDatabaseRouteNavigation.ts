import {useEffect, useMemo, useRef} from 'react'

import type {Location, NavigateFunction} from 'react-router'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import {advanceDatabaseDetailHistory} from '@/features/database/detail/database-detail-history'
import type {
  DatabaseDetailNavigationOptions,
  DatabaseDetailNavigationPort,
  DatabaseDetailNavigationState,
  DatabaseDetailRouteItem,
} from '@/features/database/detail/dbDetailRegistry'

import {resolveDatabaseRuntimeDetailReference} from './databaseEntityRuntime'
import {primeDatabaseRouteResolution} from './useDatabaseRouteResolution'

export function useDatabaseRouteNavigation({
  activeSearch,
  defaultAwakenerTab,
  location,
  navigate,
  onClose,
  routeItem,
}: {
  activeSearch: string
  defaultAwakenerTab: DatabaseAwakenerTab
  location: Location
  navigate: NavigateFunction
  onClose: () => void
  routeItem: DatabaseDetailRouteItem | null
}): DatabaseDetailNavigationPort {
  const requestVersionRef = useRef(0)

  useEffect(
    () => () => {
      requestVersionRef.current += 1
    },
    [activeSearch, defaultAwakenerTab, location, navigate, onClose, routeItem],
  )

  return useMemo(() => {
    const select = (
      ref: EntityRef,
      state: DatabaseDetailNavigationState = {},
      options?: DatabaseDetailNavigationOptions,
      historyMode: 'push' | 'replace' = 'push',
    ) => {
      const requestVersion = ++requestVersionRef.current
      void resolveDatabaseRuntimeDetailReference({
        defaultAwakenerTab,
        ref,
        search: activeSearch,
        state,
      })
        .then((target) => {
          if (requestVersion !== requestVersionRef.current || !target) return
          primeDatabaseRouteResolution(target.pathname, target.search, target.resolution)
          const nextLocation =
            options?.hash === undefined
              ? {pathname: target.pathname, search: target.search}
              : {hash: options.hash, pathname: target.pathname, search: target.search}
          if (
            target.pathname === location.pathname &&
            target.search === location.search &&
            (options?.hash ?? '') === location.hash
          )
            return
          const replace = historyMode === 'replace'
          const locationState: unknown = location.state
          void navigate(nextLocation, {
            replace,
            state: replace ? locationState : advanceDatabaseDetailHistory(locationState),
          })
        })
        .catch(() => undefined)
    }

    return {
      close: () => {
        requestVersionRef.current += 1
        onClose()
      },
      select,
      updateState: (state, options) => {
        if (routeItem)
          select(
            {kind: routeItem.kind, id: routeItem.item.id},
            state,
            options,
            state.tab ? 'push' : 'replace',
          )
      },
    }
  }, [activeSearch, defaultAwakenerTab, location, navigate, onClose, routeItem])
}
