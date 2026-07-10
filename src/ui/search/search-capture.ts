export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  )
}

export function isSearchDeletionKey(key: string): boolean {
  return key === 'Backspace' || key === 'Delete'
}

interface SearchCaptureActionOptions {
  currentSearchValue: string
  event: KeyboardEvent
  allowEscape?: boolean
}

export type SearchCaptureAction =
  | {kind: 'delete'}
  | {kind: 'character'; key: string}
  | {kind: 'escape'}

export function getSearchCaptureAction({
  currentSearchValue,
  event,
  allowEscape = false,
}: SearchCaptureActionOptions): SearchCaptureAction | null {
  if (event.defaultPrevented || event.isComposing) {
    return null
  }
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return null
  }

  if (event.key === 'Escape') {
    if (!allowEscape) {
      return null
    }
    return {kind: 'escape'}
  }

  if (isTypingTarget(event.target)) {
    return null
  }
  if (isSearchDeletionKey(event.key) && currentSearchValue.length > 0) {
    return {kind: 'delete'}
  }
  if (event.key.length !== 1) {
    return null
  }

  return {kind: 'character', key: event.key}
}
