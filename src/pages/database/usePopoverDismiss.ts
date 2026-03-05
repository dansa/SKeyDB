import { useEffect, type RefObject } from 'react'

export function usePopoverDismiss(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [ref, onClose])
}

export function usePopoverPosition(
  ref: RefObject<HTMLElement | null>,
  anchorRect: DOMRect,
): void {
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = anchorRect.bottom + 6
    let left = anchorRect.left

    if (left + rect.width > vw - 12) {
      left = vw - rect.width - 12
    }
    if (left < 12) left = 12

    if (top + rect.height > vh - 12) {
      top = anchorRect.top - rect.height - 6
    }
    if (top < 12) top = 12

    el.style.top = `${top}px`
    el.style.left = `${left}px`
  })
}
