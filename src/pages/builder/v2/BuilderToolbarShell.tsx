import type {ReactNode} from 'react'

interface BuilderToolbarShellProps {
  children: ReactNode
}

export function BuilderToolbarShell({children}: BuilderToolbarShellProps) {
  return (
    <div
      className='border-b border-slate-500/45 bg-slate-950/78'
      data-testid='builder-toolbar-shell'
    >
      {children}
    </div>
  )
}
