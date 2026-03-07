import {FaDownload, FaRotateLeft, FaUpload, FaXmark} from 'react-icons/fa6'

import {Button} from '@/components/ui/Button'
import {PageToolkitBar} from '@/components/ui/PageToolkitBar'

interface BuilderToolbarProps {
  hasTeams: boolean
  hasActiveTeam: boolean
  canUndoReset: boolean
  onImport: () => void
  onExportAll: () => void
  onExportIngame: () => void
  onUndoReset: () => void
  onRequestReset: () => void
}

export function BuilderToolbar({
  hasTeams,
  hasActiveTeam,
  canUndoReset,
  onImport,
  onExportAll,
  onExportIngame,
  onUndoReset,
  onRequestReset,
}: BuilderToolbarProps) {
  return (
    <PageToolkitBar className='collection-toolkit-drawer' sticky>
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        onClick={onImport}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaUpload aria-hidden className='text-[9px]' />
          <span>Import</span>
        </span>
      </Button>
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        disabled={!hasTeams}
        onClick={onExportAll}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaDownload aria-hidden className='text-[9px]' />
          <span>Export All</span>
        </span>
      </Button>
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        disabled={!hasActiveTeam}
        onClick={onExportIngame}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaDownload aria-hidden className='text-[9px]' />
          <span>Export In-Game</span>
        </span>
      </Button>
      <Button
        className={`px-2 py-1 text-[10px] tracking-wide uppercase ${
          canUndoReset
            ? 'border-amber-300/65 bg-amber-500/15 text-amber-100 hover:border-amber-200/85'
            : 'border-rose-300/70 bg-rose-500/14 text-rose-100 hover:border-rose-200/85'
        }`}
        onClick={canUndoReset ? onUndoReset : onRequestReset}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          {canUndoReset ? (
            <FaRotateLeft aria-hidden className='text-[9px]' />
          ) : (
            <FaXmark aria-hidden className='text-[9px]' />
          )}
          <span>{canUndoReset ? 'Undo Reset' : 'Reset Builder'}</span>
        </span>
      </Button>
    </PageToolkitBar>
  )
}
