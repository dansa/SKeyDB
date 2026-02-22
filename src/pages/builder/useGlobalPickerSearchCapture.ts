import { useEffect, type RefObject } from 'react'
import type { PickerTab } from './types'
import { isTypingTarget } from './utils'

type UseGlobalPickerSearchCaptureOptions = {
  pickerTab: PickerTab
  searchInputRef: RefObject<HTMLInputElement | null>
  onAppendCharacter: (pickerTab: PickerTab, key: string) => void
}

export function useGlobalPickerSearchCapture({
  pickerTab,
  searchInputRef,
  onAppendCharacter,
}: UseGlobalPickerSearchCaptureOptions) {
  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      if (isTypingTarget(event.target)) {
        return
      }
      if (event.key.length !== 1) {
        return
      }

      onAppendCharacter(pickerTab, event.key)
      searchInputRef.current?.focus()
      event.preventDefault()
    }

    window.addEventListener('keydown', onGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown)
    }
  }, [pickerTab, searchInputRef, onAppendCharacter])
}
