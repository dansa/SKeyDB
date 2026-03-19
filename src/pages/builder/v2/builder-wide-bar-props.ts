import type {BuilderWideBarProps} from './BuilderWideBar'

interface BuilderWideBarSource {
  activeTeam: unknown
  canUndoReset: boolean
  onExportAll: () => void
  onExportIngame: () => void
  onImport: () => void
  onRequestReset: () => void
  onUndoReset: () => void
  teamCount: number
}

export function getBuilderWideBarProps({
  activeTeam,
  canUndoReset,
  onExportAll,
  onExportIngame,
  onImport,
  onRequestReset,
  onUndoReset,
  teamCount,
}: BuilderWideBarSource): BuilderWideBarProps {
  return {
    canUndoReset,
    hasActiveTeam: Boolean(activeTeam),
    hasTeams: teamCount > 0,
    onExportAll,
    onExportIngame,
    onImport,
    onRequestReset,
    onUndoReset,
  }
}
