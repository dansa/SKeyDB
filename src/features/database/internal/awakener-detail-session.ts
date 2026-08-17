import {createContext, useContext} from 'react'

import type {AwakenerDatabaseSelection} from '@/domain/awakener-database-state'

export interface AwakenerDetailSession {
  key: string
  onSelectionChange: (selection: AwakenerDatabaseSelection) => void
  selection: AwakenerDatabaseSelection | null
}

export const AwakenerDetailSessionContext = createContext<AwakenerDetailSession | null>(null)

export function useAwakenerDetailSession(): AwakenerDetailSession | null {
  return useContext(AwakenerDetailSessionContext)
}
