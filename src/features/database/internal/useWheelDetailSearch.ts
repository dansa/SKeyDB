import {useCallback} from 'react'

import type {Wheel} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'

import {useDetailEntitySearch} from './useDetailEntitySearch'

interface UseWheelDetailSearchOptions {
  wheels: Wheel[]
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

export function useWheelDetailSearch({wheels, onSelectWheel}: UseWheelDetailSearchOptions) {
  const handleSelectWheel = useCallback(
    (wheel: Wheel) => {
      onSelectWheel?.(wheel)
    },
    [onSelectWheel],
  )

  return useDetailEntitySearch({
    items: wheels,
    onSelectResult: handleSelectWheel,
    searchItems: searchWheels,
  })
}
