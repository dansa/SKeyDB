import {Button} from '@/components/ui/Button'
import {useInlineEditor} from '@/hooks/useInlineEditor'

import {useBuilderStore} from './store/builder-store'

interface CurrentTeamActionBarProps {
  onQuickLineup: () => void
  onRequestResetTeam: (teamId: string, teamName: string) => void
  teamId: string
  teamName: string
}

export function CurrentTeamActionBar({
  onQuickLineup,
  onRequestResetTeam,
  teamId,
  teamName,
}: CurrentTeamActionBarProps) {
  const renameTeam = useBuilderStore((state) => state.renameTeam)
  const renameEditor = useInlineEditor({
    value: teamName,
    onCommit: (nextName) => {
      renameTeam(teamId, nextName)
    },
    validate: (draft) => draft.trim() || 'Unnamed',
  })

  return (
    <div
      className='shrink-0 border-b border-slate-500/45 px-2 py-1.5'
      data-testid='current-team-action-bar'
    >
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
        <div className='grid grid-cols-3 gap-2'>
          <Button
            className='px-2 py-1 text-[10px] tracking-[0.08em] uppercase'
            onClick={renameEditor.beginEdit}
            type='button'
          >
            Rename
          </Button>
          <Button
            className='px-2 py-1 text-[10px] tracking-[0.08em] uppercase'
            onClick={() => {
              onRequestResetTeam(teamId, teamName)
            }}
            type='button'
            variant='danger'
          >
            Reset Team
          </Button>
          <Button
            className='px-2 py-1 text-[10px] tracking-[0.08em] uppercase'
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
