import {useRef, type CSSProperties, type ReactNode, type Ref} from 'react'

import {createPortal} from 'react-dom'

import {useNativeModalDialog} from '@/ui/modal/useNativeModalDialog'

type DbDetailModalMaxWidth = 'standard' | 'wide'

interface DbDetailModalFrameProps {
  ariaLabel: string
  children: ReactNode
  header?: ReactNode
  maxWidth?: DbDetailModalMaxWidth
  onCancel?: (event: Event) => void
  onOverlayClick?: (event: MouseEvent) => void
  onPanelKeyDown?: (event: KeyboardEvent) => void
  panelRef?: Ref<HTMLDivElement>
  shellClassName?: string
  shellStyle?: CSSProperties
}

const SHELL_MAX_WIDTH_CLASS: Record<DbDetailModalMaxWidth, string> = {
  standard: 'max-w-5xl',
  wide: 'max-w-6xl',
}

function getDetailPortalRoot(): Element {
  return document.querySelector('.app-shell') ?? document.body
}

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
  const dialogRef = useRef<HTMLDialogElement>(null)

  useNativeModalDialog({
    dialogRef,
    onCancel,
    onClick: onOverlayClick,
    onKeyDown: onPanelKeyDown,
  })

  return createPortal(
    <dialog
      aria-label={ariaLabel}
      className='fixed inset-0 z-[960] m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center overflow-hidden overscroll-contain border-0 p-3 open:flex sm:p-4 md:p-5 lg:p-6'
      data-detail-modal-overlay=''
      ref={dialogRef}
    >
      <div
        className={`relative z-[961] flex max-h-[calc(100dvh-1.5rem)] w-full ${SHELL_MAX_WIDTH_CLASS[maxWidth]} flex-col gap-2.5 sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-2.5rem)] md:gap-3 lg:max-h-[calc(100dvh-3rem)] ${shellClassName}`}
        data-detail-modal-shell=''
        ref={panelRef}
        style={shellStyle}
      >
        {header}
        {children}
      </div>
    </dialog>,
    getDetailPortalRoot(),
  )
}
