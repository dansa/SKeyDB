import type { ReactNode } from 'react'

type PanelSectionProps = {
  title: string
  description?: string
  className?: string
  children: ReactNode
}

function joinClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

export function PanelSection({ title, description, className, children }: PanelSectionProps) {
  return (
    <section className={joinClasses('space-y-2', className)}>
      <header className="space-y-0.5">
        <h3 className="ui-title text-sm text-amber-100">{title}</h3>
        {description ? <p className="text-[11px] text-slate-300">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}

