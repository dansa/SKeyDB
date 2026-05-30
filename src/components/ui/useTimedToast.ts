import {useCallback, useEffect, useRef, useState, type RefObject} from 'react'

interface UseTimedToastOptions {
  defaultDurationMs?: number
}

interface TimedToastEntry {
  id: number
  message: string
}

function getTimeoutMap(ref: RefObject<Map<number, number> | null>): Map<number, number> {
  ref.current ??= new Map<number, number>()
  return ref.current
}

export function useTimedToast({defaultDurationMs = 3200}: UseTimedToastOptions = {}) {
  const [toastEntries, setToastEntries] = useState<TimedToastEntry[]>([])
  const nextToastIdRef = useRef(0)
  const timeoutRefs = useRef<Map<number, number> | null>(null)

  const clearToast = useCallback(() => {
    const timeoutMap = getTimeoutMap(timeoutRefs)
    for (const timeoutId of timeoutMap.values()) {
      window.clearTimeout(timeoutId)
    }
    timeoutMap.clear()
    setToastEntries([])
  }, [])

  const dismissToast = useCallback((toastId: number) => {
    const timeoutMap = getTimeoutMap(timeoutRefs)
    timeoutMap.delete(toastId)
    setToastEntries((previous) => previous.filter((entry) => entry.id !== toastId))
  }, [])

  const showToast = useCallback(
    (message: string, durationMs = defaultDurationMs) => {
      const toastId = nextToastIdRef.current
      nextToastIdRef.current += 1

      setToastEntries((previous) => [...previous, {id: toastId, message}])
      const timeoutId = window.setTimeout(() => {
        dismissToast(toastId)
      }, durationMs)
      const timeoutMap = getTimeoutMap(timeoutRefs)
      timeoutMap.set(toastId, timeoutId)
    },
    [defaultDurationMs, dismissToast],
  )

  useEffect(
    () => () => {
      const timeoutMap = timeoutRefs.current
      if (!timeoutMap) {
        return
      }
      for (const timeoutId of timeoutMap.values()) {
        window.clearTimeout(timeoutId)
      }
      timeoutMap.clear()
    },
    [],
  )

  const toastMessages = toastEntries.map((entry) => entry.message)
  const toastMessage = toastMessages.at(-1) ?? null

  return {toastEntries, toastMessage, toastMessages, showToast, clearToast}
}
