import {useEffect, useRef} from 'react'

import {useSuppressDetailEntitySearchCapture} from './useDetailEntitySearch'

interface DatabaseArtViewerOverlayProps {
  alt: string
  src: string
  onClose: () => void
}

export function DatabaseArtViewerOverlay({alt, onClose, src}: DatabaseArtViewerOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useSuppressDetailEntitySearchCapture()

  useEffect(() => {
    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    containerRef.current?.focus()

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onClose()
    }

    window.addEventListener('keydown', handleEscape, true)
    return () => {
      window.removeEventListener('keydown', handleEscape, true)
      previousFocusedElement?.focus()
    }
  }, [onClose])

  return (
    <div
      aria-label={alt}
      aria-modal='true'
      className='fixed inset-0 z-[920] flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-[2px] md:p-6'
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
      ref={containerRef}
      role='dialog'
      tabIndex={-1}
    >
      <div
        className='flex max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] items-center justify-center md:max-h-[calc(100dvh-3rem)] md:max-w-[calc(100vw-3rem)]'
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <img
          alt={alt}
          className='block max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] object-contain shadow-[0_28px_80px_rgba(2,6,23,0.72)] md:max-h-[calc(100dvh-3rem)] md:max-w-[calc(100vw-3rem)]'
          draggable={false}
          src={src}
        />
      </div>
    </div>
  )
}
