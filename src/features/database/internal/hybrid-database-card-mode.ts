import {createContext, useContext} from 'react'

export type HybridDatabaseCardMode = 'poster' | 'dossier'

export const HybridDatabaseCardModeContext = createContext<
  HybridDatabaseCardMode | null | undefined
>(undefined)

export function useHybridDatabaseCardMode(): HybridDatabaseCardMode | null | undefined {
  return useContext(HybridDatabaseCardModeContext)
}
