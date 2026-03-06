import { useCallback, useEffect, useRef } from 'react'

type UseHoldRepeatActionOptions = {
  onStep: () => void
  disabled?: boolean
  holdDelayMs?: number
  repeatMs?: number
}

type UseHoldRepeatActionResult = {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onPointerCancel: () => void
  onBlur: () => void
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function useHoldRepeatAction({
  onStep,
  disabled = false,
  holdDelayMs = 320,
  repeatMs = 95,
}: UseHoldRepeatActionOptions): UseHoldRepeatActionResult {
  const holdTimeoutRef = useRef<number | null>(null)
  const holdIntervalRef = useRef<number | null>(null)
  const didRepeatRef = useRef(false)
  const suppressNextClickRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }, [])

  const onPointerUp = useCallback(() => {
    clearTimers()
    if (didRepeatRef.current) {
      suppressNextClickRef.current = true
    }
  }, [clearTimers])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) {
        return
      }
      event.preventDefault()
      didRepeatRef.current = false
      suppressNextClickRef.current = false
      clearTimers()

      holdTimeoutRef.current = window.setTimeout(() => {
        didRepeatRef.current = true
        onStep()
        holdIntervalRef.current = window.setInterval(() => {
          didRepeatRef.current = true
          onStep()
        }, repeatMs)
      }, holdDelayMs)
    },
    [clearTimers, disabled, holdDelayMs, onStep, repeatMs],
  )

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        event.preventDefault()
        event.stopPropagation()
        return
      }
      onStep()
    },
    [disabled, onStep],
  )

  useEffect(() => clearTimers, [clearTimers])

  return {
    onPointerDown,
    onPointerUp,
    onPointerLeave: onPointerUp,
    onPointerCancel: onPointerUp,
    onBlur: onPointerUp,
    onClick,
  }
}
