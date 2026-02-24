import { useCallback, useEffect, useRef, useState } from 'react'

type UseTimedToastOptions = {
  defaultDurationMs?: number
}

export function useTimedToast({ defaultDurationMs = 3200 }: UseTimedToastOptions = {}) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const clearToast = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setToastMessage(null)
  }, [])

  const showToast = useCallback(
    (message: string, durationMs = defaultDurationMs) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      setToastMessage(message)
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        setToastMessage(null)
      }, durationMs)
    },
    [defaultDurationMs],
  )

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    },
    [],
  )

  return { toastMessage, showToast, clearToast }
}
