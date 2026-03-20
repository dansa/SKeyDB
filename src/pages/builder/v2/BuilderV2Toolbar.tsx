import {BuilderToolbar} from '../BuilderToolbar'
import {getBuilderWideBarProps} from './builder-wide-bar-props'
import type {BuilderV2ActionsResult} from './useBuilderV2Actions'

interface BuilderV2ToolbarProps {
  actions: BuilderV2ActionsResult
  attached?: boolean
}

export function BuilderV2Toolbar({actions, attached = false}: BuilderV2ToolbarProps) {
  return (
    <BuilderToolbar
      attached={attached}
      {...getBuilderWideBarProps({
        activeTeam: actions.activeTeam,
        canUndoReset: actions.canUndoReset,
        onExportAll: actions.openExportAllDialog,
        onExportIngame: actions.handleExportIngame,
        onImport: actions.openImportDialog,
        onRequestReset: actions.requestReset,
        onUndoReset: actions.undoReset,
        teamCount: actions.teams.length,
      })}
    />
  )
}
