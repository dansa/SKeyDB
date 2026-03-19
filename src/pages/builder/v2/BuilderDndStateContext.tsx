import type {ReactNode} from 'react'

import {BuilderDndStateContext, type BuilderDndStateValue} from './builder-dnd-state'

export function BuilderDndStateProvider({
  children,
  value,
}: {
  children: ReactNode
  value: BuilderDndStateValue
}) {
  return <BuilderDndStateContext.Provider value={value}>{children}</BuilderDndStateContext.Provider>
}
