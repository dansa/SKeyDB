import type {CSSProperties, KeyboardEventHandler, MouseEventHandler, ReactNode, Ref} from 'react'

import {createPortal} from 'react-dom'

type DbDetailModalMaxWidth = 'standard' | 'wide'

interface DbDetailModalFrameProps {
  ariaLabel: string
  beforeBody?: ReactNode
  children: ReactNode
  maxWidth?: DbDetailModalMaxWidth
  onOverlayClick?: MouseEventHandler<HTMLDivElement>
  onPanelKeyDown?: KeyboardEventHandler<HTMLDivElement>
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
  beforeBody = null,
  children,
  maxWidth = 'wide',
  onOverlayClick,
  onPanelKeyDown,
  panelRef,
  shellClassName = '',
  shellStyle,
}: DbDetailModalFrameProps) {
  return createPortal(
    <div
      className='fixed inset-0 z-[960] flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6'
      data-detail-modal-overlay=''
      onClick={onOverlayClick}
    >
      <div
        aria-label={ariaLabel}
        aria-modal='true'
        className={`relative z-[961] flex max-h-[calc(100dvh-1.5rem)] w-full ${SHELL_MAX_WIDTH_CLASS[maxWidth]} flex-col gap-2.5 sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-2.5rem)] md:gap-3 lg:max-h-[calc(100dvh-3rem)] ${shellClassName}`}
        data-detail-modal-shell=''
        ref={panelRef}
        role='dialog'
        style={shellStyle}
        onKeyDown={onPanelKeyDown}
      >
        {beforeBody}
        {children}
      </div>
    </div>,
    getDetailPortalRoot(),
  )
}
