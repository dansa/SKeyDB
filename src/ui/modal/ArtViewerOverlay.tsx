import {useEffect, useRef} from 'react'

import {useNativeModalDialog} from './useNativeModalDialog'

interface ArtViewerOverlayProps {
  alt: string
  src: string
  onClose: () => void
  onMount?: () => undefined | (() => void)
}

export function ArtViewerOverlay({alt, onClose, onMount, src}: ArtViewerOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    return onMount?.()
  }, [onMount])

  useNativeModalDialog({
    dialogRef,
    initialFocusRef: dialogRef,
    lockBodyScroll: true,
    onCancel: (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    },
    onClick: (event) => {
      if (event.target !== event.currentTarget) {
        return
      }

      event.stopPropagation()
      onClose()
    },
  })

  return (
    <dialog
      aria-label={alt}
      className='fixed inset-0 z-[920] m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center border-0 bg-slate-950/88 p-4 backdrop-blur-[2px] open:flex md:p-6'
      data-detail-result-navigation-boundary=''
      ref={dialogRef}
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
    </dialog>
  )
}
