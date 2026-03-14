import {useInlineEditor} from '@/hooks/useInlineEditor'

import {useBuilderStore} from '../store/builder-store'

interface MobileBuilderWideBarProps {
  canUndoReset: boolean
  onImport: () => void
  onExportAll: () => void
  onExportIngame: () => void
  onRequestReset: () => void
  onUndoReset: () => void
}

export function MobileBuilderWideBar({
  canUndoReset,
  onImport,
  onExportAll,
  onExportIngame,
  onRequestReset,
  onUndoReset,
}: MobileBuilderWideBarProps) {
  return (
    <div className='shrink-0 border-b border-slate-500/45 px-2 py-2'>
      <div className='grid grid-cols-2 gap-2 min-[520px]:grid-cols-4'>
        <button
          className='border border-slate-500/45 bg-slate-950/55 px-2 py-1.5 text-[10px] tracking-[0.08em] text-slate-200 uppercase'
          onClick={onImport}
          type='button'
        >
          Import
        </button>
        <button
          className='border border-slate-500/45 bg-slate-950/55 px-2 py-1.5 text-[10px] tracking-[0.08em] text-slate-200 uppercase'
          onClick={onExportAll}
          type='button'
        >
          Export All
        </button>
        <button
          className='border border-slate-500/45 bg-slate-950/55 px-2 py-1.5 text-[10px] tracking-[0.08em] text-slate-200 uppercase'
          onClick={onExportIngame}
          type='button'
        >
          Export In-Game
        </button>
        <button
          className={`px-2 py-1.5 text-[10px] tracking-[0.08em] uppercase ${
            canUndoReset
              ? 'border border-amber-300/55 bg-amber-500/10 text-amber-100'
              : 'border border-rose-300/55 bg-rose-500/10 text-rose-100'
          }`}
          onClick={canUndoReset ? onUndoReset : onRequestReset}
          type='button'
        >
          {canUndoReset ? 'Undo Reset' : 'Reset Builder'}
        </button>
      </div>
    </div>
  )
}

export function MobileCurrentTeamBar({
  teamId,
  teamName,
  onQuickLineup,
}: {
  teamId: string
  teamName: string
  onQuickLineup: () => void
}) {
  const renameTeam = useBuilderStore((state) => state.renameTeam)
  const resetTeam = useBuilderStore((state) => state.resetTeam)
  const renameEditor = useInlineEditor({
    value: teamName,
    onCommit: (nextName) => {
      renameTeam(teamId, nextName)
    },
    validate: (draft) => draft.trim() || 'Unnamed',
  })

  return (
    <div className='shrink-0 border-b border-slate-500/45 px-2 py-2'>
      {renameEditor.isEditing ? (
        <div className='flex items-center gap-2'>
          <input
            autoFocus
            className='min-w-0 flex-1 border-b border-amber-300/40 bg-transparent px-1 py-1 text-sm text-slate-100 outline-none'
            onChange={(event) => {
              renameEditor.setDraft(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                renameEditor.commit()
              }
              if (event.key === 'Escape') {
                renameEditor.cancel()
              }
            }}
            value={renameEditor.draftValue}
          />
          <button
            className='border border-emerald-300/40 bg-slate-950/45 px-2 py-1 text-[10px] text-emerald-200'
            onClick={renameEditor.commit}
            type='button'
          >
            Save
          </button>
          <button
            className='border border-slate-500/45 bg-slate-950/45 px-2 py-1 text-[10px] text-slate-300'
            onClick={renameEditor.cancel}
            type='button'
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-3 gap-2'>
          <button
            className='border border-slate-500/45 bg-slate-950/55 px-2 py-1.5 text-[10px] tracking-[0.08em] text-slate-200 uppercase'
            onClick={renameEditor.beginEdit}
            type='button'
          >
            Rename
          </button>
          <button
            className='border border-rose-300/40 bg-rose-500/8 px-2 py-1.5 text-[10px] tracking-[0.08em] text-rose-100 uppercase'
            onClick={() => {
              resetTeam(teamId)
            }}
            type='button'
          >
            Reset Team
          </button>
          <button
            className='border border-amber-500/50 bg-amber-500/10 px-2 py-1.5 text-[10px] tracking-[0.08em] text-amber-300 uppercase'
            onClick={onQuickLineup}
            type='button'
          >
            Quick Lineup
          </button>
        </div>
      )}
    </div>
  )
}
