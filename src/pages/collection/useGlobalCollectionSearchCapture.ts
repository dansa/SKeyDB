import { useEffect, type RefObject } from 'react'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable
}

type UseGlobalCollectionSearchCaptureOptions = {
  searchInputRef: RefObject<HTMLInputElement | null>
  onAppendCharacter: (key: string) => void
  onClearSearch: () => void
}

export function useGlobalCollectionSearchCapture({
  searchInputRef,
  onAppendCharacter,
  onClearSearch,
}: UseGlobalCollectionSearchCaptureOptions) {
  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key === 'Escape') {
        onClearSearch()
        searchInputRef.current?.focus()
        event.preventDefault()
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }
      if (event.key.length !== 1) {
        return
      }

      onAppendCharacter(event.key)
      searchInputRef.current?.focus()
      event.preventDefault()
    }

    window.addEventListener('keydown', onGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown)
    }
  }, [searchInputRef, onAppendCharacter, onClearSearch])
}

