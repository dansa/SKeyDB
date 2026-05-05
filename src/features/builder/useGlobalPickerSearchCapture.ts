import {useEffect, type RefObject} from 'react'

import {getSearchCaptureAction} from '@/ui/search/search-capture'

import type {PickerTab} from './types'

interface UseGlobalPickerSearchCaptureOptions {
  pickerTab: PickerTab
  searchInputRef: RefObject<HTMLInputElement | null>
  onAppendCharacter: (pickerTab: PickerTab, key: string) => void
  onRemoveCharacter: (pickerTab: PickerTab) => void
}

export function useGlobalPickerSearchCapture({
  pickerTab,
  searchInputRef,
  onAppendCharacter,
  onRemoveCharacter,
}: UseGlobalPickerSearchCaptureOptions) {
  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      const action = getSearchCaptureAction({
        currentSearchValue: searchInputRef.current?.value ?? '',
        event,
      })
      if (!action) {
        return
      }

      event.preventDefault()

      if (action.kind === 'delete') {
        onRemoveCharacter(pickerTab)
        searchInputRef.current?.focus()
        return
      }

      if (action.kind === 'character') {
        onAppendCharacter(pickerTab, action.key)
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown)
    }
  }, [pickerTab, searchInputRef, onAppendCharacter, onRemoveCharacter])
}
