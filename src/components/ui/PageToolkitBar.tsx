import type { ReactNode } from 'react'

type PageToolkitBarProps = {
  children: ReactNode
  className?: string
  sticky?: boolean
}

function joinClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

export function PageToolkitBar({ children, className, sticky = false }: PageToolkitBarProps) {
  return (
    <div
      className={joinClasses(
        'flex items-center justify-end gap-1.5 -mt-4 md:-mt-5 mb-6 p-2 border border-amber-200/30',
        sticky && 'sticky top-0 z-30 backdrop-blur-[2px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

