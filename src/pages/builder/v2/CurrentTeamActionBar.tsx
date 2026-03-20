import {Button} from '@/components/ui/Button'
import {useInlineEditor} from '@/hooks/useInlineEditor'

import {useBuilderStore} from './store/builder-store'

interface CurrentTeamActionBarProps {
  onQuickLineup: () => void
  onRequestResetTeam: (teamId: string, teamName: string) => void
  teamId: string
  teamName: string
  placement?: 'top' | 'bottom'
  dense?: boolean
  showRename?: boolean
}

export function CurrentTeamActionBar({
  onQuickLineup,
  onRequestResetTeam,
  teamId,
  teamName,
  placement = 'top',
  dense = false,
  showRename = true,
}: CurrentTeamActionBarProps) {
  const renameTeam = useBuilderStore((state) => state.renameTeam)
  const renameEditor = useInlineEditor({
    value: teamName,
    onCommit: (nextName) => {
      renameTeam(teamId, nextName)
    },
    validate: (draft) => draft.trim() || 'Unnamed',
  })

  const shellClassName =
    placement === 'bottom'
      ? 'flex shrink-0 justify-end border-t border-slate-500/45 px-3 py-2'
      : 'shrink-0 border-b border-slate-500/45 px-2 py-1.5'
  const buttonClassName = dense
    ? 'px-3 py-1 text-[10px] tracking-[0.08em] uppercase'
    : 'px-2 py-1 text-[10px] tracking-[0.08em] uppercase'

  return (
    <div className={shellClassName} data-testid='current-team-action-bar'>
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
          <Button
            className='px-2 py-1 text-[10px]'
            onClick={renameEditor.commit}
            type='button'
            variant='success'
          >
            Save
          </Button>
          <Button className='px-2 py-1 text-[10px]' onClick={renameEditor.cancel} type='button'>
            Cancel
          </Button>
        </div>
      ) : (
        <div
          className={
            placement === 'bottom'
              ? 'flex flex-wrap items-center justify-end gap-2'
              : `grid gap-2 ${showRename ? 'grid-cols-3' : 'grid-cols-2'}`
          }
        >
          {showRename ? (
            <Button className={buttonClassName} onClick={renameEditor.beginEdit} type='button'>
              Rename
            </Button>
          ) : null}
          <Button
            className={buttonClassName}
            onClick={() => {
              onRequestResetTeam(teamId, teamName)
            }}
            type='button'
            variant='danger'
          >
            Reset Team
          </Button>
          <Button
            className={buttonClassName}
            onClick={onQuickLineup}
            type='button'
            variant='primary'
          >
            Quick Lineup
          </Button>
        </div>
      )}
    </div>
  )
}
