import {useCallback, useState} from 'react'

export interface UseInlineEditorOptions {
  value: string
  onCommit: (nextValue: string) => void
  validate?: (draft: string) => string
}

export interface UseInlineEditorResult {
  isEditing: boolean
  draftValue: string
  beginEdit: () => void
  setDraft: (nextDraft: string) => void
  commit: () => void
  cancel: () => void
}

export function useInlineEditor(options: UseInlineEditorOptions): UseInlineEditorResult {
  const {value, onCommit, validate} = options
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState('')

  const beginEdit = useCallback(() => {
    setDraftValue(value)
    setIsEditing(true)
  }, [value])

  const commit = useCallback(() => {
    const finalValue = validate ? validate(draftValue) : draftValue
    setIsEditing(false)
    onCommit(finalValue)
  }, [draftValue, onCommit, validate])

  const cancel = useCallback(() => {
    setIsEditing(false)
    setDraftValue('')
  }, [])

  return {
    isEditing,
    draftValue,
    beginEdit,
    setDraft: setDraftValue,
    commit,
    cancel,
  }
}
