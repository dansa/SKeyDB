import {useEffect, type RefObject} from 'react'

import {getSearchCaptureAction} from './search-capture'

interface UseGlobalSearchCaptureOptions {
  enabled?: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onAppendCharacter: (key: string) => void
  onRemoveCharacter: () => void
  onClearSearch: () => void
}

export function useGlobalSearchCapture({
  enabled = true,
  searchInputRef,
  onAppendCharacter,
  onRemoveCharacter,
  onClearSearch,
}: UseGlobalSearchCaptureOptions) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    function onGlobalKeyDown(event: KeyboardEvent) {
      const action = getSearchCaptureAction({
        currentSearchValue: searchInputRef.current?.value ?? '',
        event,
        allowEscape: true,
      })
      if (!action) {
        return
      }

      event.preventDefault()

      if (action.kind === 'delete') {
        onRemoveCharacter()
        searchInputRef.current?.focus()
        return
      }

      if (action.kind === 'character') {
        onAppendCharacter(action.key)
        searchInputRef.current?.focus()
        return
      }

      onClearSearch()
    }

    window.addEventListener('keydown', onGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown)
    }
  }, [enabled, searchInputRef, onAppendCharacter, onRemoveCharacter, onClearSearch])
}
