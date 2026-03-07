import type {ReactNode} from 'react'

interface PageToolkitBarProps {
  children: ReactNode
  className?: string
  sticky?: boolean
}

function joinClasses(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function PageToolkitBar({children, className, sticky = false}: PageToolkitBarProps) {
  return (
    <div
      className={joinClasses(
        '-mt-4 mb-6 flex items-center justify-end gap-1.5 border border-amber-200/30 p-2 md:-mt-5',
        sticky && 'sticky top-0 z-30 backdrop-blur-[2px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
