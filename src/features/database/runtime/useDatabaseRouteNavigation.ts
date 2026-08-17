import {useEffect, useMemo, useRef} from 'react'

import type {NavigateFunction} from 'react-router'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import type {
  DatabaseDetailNavigationPort,
  DatabaseDetailNavigationState,
  DatabaseDetailRouteItem,
} from '@/features/database/detail/dbDetailRegistry'

import {resolveDatabaseRuntimeDetailReference} from './databaseEntityRuntime'
import {primeDatabaseRouteResolution} from './useDatabaseRouteResolution'

export function useDatabaseRouteNavigation({
  activeSearch,
  defaultAwakenerTab,
  locationState,
  navigate,
  onClose,
  routeItem,
}: {
  activeSearch: string
  defaultAwakenerTab: DatabaseAwakenerTab
  locationState: unknown
  navigate: NavigateFunction
  onClose: () => void
  routeItem: DatabaseDetailRouteItem | null
}): DatabaseDetailNavigationPort {
  const requestVersionRef = useRef(0)

  useEffect(
    () => () => {
      requestVersionRef.current += 1
    },
    [activeSearch, defaultAwakenerTab, locationState, navigate, onClose, routeItem],
  )

  return useMemo(() => {
    const select = (ref: EntityRef, state: DatabaseDetailNavigationState = {}) => {
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
          void navigate(
            {pathname: target.pathname, search: target.search},
            {replace: true, state: locationState},
          )
        })
        .catch(() => undefined)
    }

    return {
      close: () => {
        requestVersionRef.current += 1
        onClose()
      },
      select,
      updateState: (state) => {
        if (routeItem) select({kind: routeItem.kind, id: routeItem.item.id}, state)
      },
    }
  }, [activeSearch, defaultAwakenerTab, locationState, navigate, onClose, routeItem])
}
