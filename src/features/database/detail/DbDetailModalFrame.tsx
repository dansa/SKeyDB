import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useEffectEvent,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'

import {createPortal} from 'react-dom'

type DbDetailModalMaxWidth = 'standard' | 'wide'

interface DbDetailModalFrameProps {
  ariaLabel: string
  children: ReactNode
  header?: ReactNode
  maxWidth?: DbDetailModalMaxWidth
  onCancel?: (event: Event) => void
  onOverlayClick?: (event: MouseEvent) => void
  onPanelKeyDown?: (event: KeyboardEvent) => void
  panelRef?: Ref<HTMLDivElement | null>
  shellClassName?: string
  shellStyle?: CSSProperties
}

interface InertSiblingSnapshot {
  element: HTMLElement
  inert: boolean
  ariaHidden: string | null
}

const SHELL_MAX_WIDTH_CLASS: Record<DbDetailModalMaxWidth, string> = {
  standard: 'max-w-5xl',
  wide: 'max-w-6xl',
}

const BACKGROUND_SCROLL_KEYS = new Set(['PageDown', 'PageUp', 'Home', 'End'])

export function DbDetailModalFrame({
  ariaLabel,
  children,
  header = null,
  maxWidth = 'wide',
  onCancel,
  onOverlayClick,
  onPanelKeyDown,
  panelRef,
  shellClassName = '',
  shellStyle,
}: DbDetailModalFrameProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    panelRef,
    () => contentRef.current,
    [],
  )
  const handleOverlayClickEvent = useEffectEvent((event: MouseEvent) => {
    onOverlayClick?.(event)
  })

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const content = contentRef.current
    if (!overlay || !content) {
      return undefined
    }
    const modalOverlay = overlay
    const modalContent = content
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const inertSiblings = getInertSiblingSnapshots(modalOverlay)
    for (const {element} of inertSiblings) {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    }

    modalContent.focus({preventScroll: true})

    function containFocus(event: FocusEvent) {
      if (event.target instanceof Node && !modalOverlay.contains(event.target)) {
        modalContent.focus({preventScroll: true})
      }
    }

    function containWheel(event: WheelEvent) {
      if (!canScrollWithinModal(event.target, modalOverlay, event.deltaY)) {
        event.preventDefault()
      }
    }

    function handleOverlayClick(event: MouseEvent) {
      handleOverlayClickEvent(event)
    }

    document.addEventListener('focusin', containFocus, true)
    modalOverlay.addEventListener('click', handleOverlayClick)
    modalOverlay.addEventListener('wheel', containWheel, {passive: false})
    return () => {
      document.removeEventListener('focusin', containFocus, true)
      modalOverlay.removeEventListener('click', handleOverlayClick)
      modalOverlay.removeEventListener('wheel', containWheel)
      restoreInertSiblings(inertSiblings)
      previouslyFocusedElement?.focus({preventScroll: true})
    }
  }, [])

  return createPortal(
    <div
      className='fixed inset-0 z-[960] flex h-dvh w-screen items-center justify-center overflow-hidden overscroll-contain p-3 sm:p-4 md:p-5 lg:p-6'
      data-detail-modal-overlay=''
      ref={overlayRef}
    >
      <div
        aria-label={ariaLabel}
        aria-modal='true'
        className={`relative z-[961] flex max-h-[calc(100dvh-1.5rem)] w-full ${SHELL_MAX_WIDTH_CLASS[maxWidth]} flex-col gap-2.5 sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-2.5rem)] md:gap-3 lg:max-h-[calc(100dvh-3rem)] ${shellClassName}`}
        data-detail-modal-shell=''
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (onCancel) {
              onCancel(event.nativeEvent)
            } else {
              event.preventDefault()
              event.stopPropagation()
            }
            return
          }
          if (shouldPreventBackgroundKeyboardScroll(event.nativeEvent, event.currentTarget)) {
            event.preventDefault()
          }
          onPanelKeyDown?.(event.nativeEvent)
        }}
        ref={contentRef}
        role='dialog'
        style={shellStyle}
        tabIndex={-1}
      >
        {header}
        {children}
      </div>
    </div>,
    document.body,
  )
}

function shouldPreventBackgroundKeyboardScroll(event: KeyboardEvent, modal: HTMLElement): boolean {
  const target = event.target
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.matches('input, textarea, select, [contenteditable="true"], [role="slider"]')) {
    return false
  }

  if (BACKGROUND_SCROLL_KEYS.has(event.key)) {
    return true
  }

  return target === modal && [' ', 'ArrowDown', 'ArrowUp'].includes(event.key)
}

function canScrollWithinModal(
  target: EventTarget | null,
  modal: HTMLElement,
  deltaY: number,
): boolean {
  if (!(target instanceof HTMLElement) || deltaY === 0) {
    return false
  }

  let element: HTMLElement | null = target
  while (element && element !== modal) {
    const {overflowY} = window.getComputedStyle(element)
    const isScrollable = /(auto|scroll|overlay)/.test(overflowY)
    if (isScrollable && element.scrollHeight > element.clientHeight) {
      const canScrollUp = deltaY < 0 && element.scrollTop > 0
      const canScrollDown =
        deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight
      if (canScrollUp || canScrollDown) {
        return true
      }
    }
    element = element.parentElement
  }

  return false
}

function getInertSiblingSnapshots(overlay: HTMLElement): InertSiblingSnapshot[] {
  const parent = overlay.parentElement
  if (!parent) {
    return []
  }

  return Array.from(parent.children)
    .filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== overlay,
    )
    .map((element) => ({
      ariaHidden: element.getAttribute('aria-hidden'),
      element,
      inert: element.inert,
    }))
}

function restoreInertSiblings(snapshots: InertSiblingSnapshot[]) {
  for (const {ariaHidden, element, inert} of snapshots) {
    element.inert = inert
    if (ariaHidden === null) {
      element.removeAttribute('aria-hidden')
    } else {
      element.setAttribute('aria-hidden', ariaHidden)
    }
  }
}
