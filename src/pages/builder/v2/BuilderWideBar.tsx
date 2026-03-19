import {Button} from '@/components/ui/Button'

export interface BuilderWideBarProps {
  canUndoReset: boolean
  hasActiveTeam: boolean
  hasTeams: boolean
  onImport: () => void
  onExportAll: () => void
  onExportIngame: () => void
  onRequestReset: () => void
  onUndoReset: () => void
}

export function BuilderWideBar({
  canUndoReset,
  hasActiveTeam,
  hasTeams,
  onImport,
  onExportAll,
  onExportIngame,
  onRequestReset,
  onUndoReset,
}: BuilderWideBarProps) {
  return (
    <div className='shrink-0 border-b border-slate-500/45 px-2 py-2'>
      <div className='grid grid-cols-2 gap-2 min-[520px]:grid-cols-4'>
        <Button
          className='px-2 py-1.5 text-[10px] tracking-[0.08em] uppercase'
          onClick={onImport}
          type='button'
        >
          Import
        </Button>
        <Button
          className='px-2 py-1.5 text-[10px] tracking-[0.08em] uppercase'
          disabled={!hasTeams}
          onClick={onExportAll}
          type='button'
        >
          Export All
        </Button>
        <Button
          className='px-2 py-1.5 text-[10px] tracking-[0.08em] uppercase'
          disabled={!hasActiveTeam}
          onClick={onExportIngame}
          type='button'
        >
          Export In-Game
        </Button>
        <Button
          className='px-2 py-1.5 text-[10px] tracking-[0.08em] uppercase'
          onClick={canUndoReset ? onUndoReset : onRequestReset}
          type='button'
          variant={canUndoReset ? 'primary' : 'danger'}
        >
          {canUndoReset ? 'Undo Reset' : 'Reset Builder'}
        </Button>
      </div>
    </div>
  )
}
