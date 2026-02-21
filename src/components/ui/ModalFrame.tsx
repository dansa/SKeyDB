import type { ReactNode } from 'react'

type ModalFrameProps = {
  title: string
  children: ReactNode
  footer?: ReactNode
  ariaLabel?: string
  overlayClassName?: string
  panelClassName?: string
}

export function ModalFrame({
  title,
  children,
  footer,
  ariaLabel,
  overlayClassName = 'fixed inset-0 z-70 flex items-center justify-center bg-slate-950/55 px-4',
  panelClassName = 'w-full max-w-lg border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]',
}: ModalFrameProps) {
  return (
    <div className={overlayClassName}>
      <div aria-label={ariaLabel ?? title} aria-modal="true" className={panelClassName} role="dialog">
        <h4 className="ui-title text-xl text-amber-100">{title}</h4>
        {children}
        {footer}
      </div>
    </div>
  )
}
