import {Button} from '@/components/ui/Button'

interface FocusedActionBarProps {
  canClearSlot: boolean
  onBack: () => void
  onClearSlot: () => void
  onQuickLineup: () => void
}

export function FocusedActionBar({
  canClearSlot,
  onBack,
  onClearSlot,
  onQuickLineup,
}: FocusedActionBarProps) {
  return (
    <div className='flex shrink-0 items-center justify-between border-b border-slate-500/45 px-3 py-2'>
      <Button className='px-2 py-1 text-[10px]' onClick={onBack} type='button'>
        ← Team
      </Button>
      <div className='flex items-center gap-2'>
        {canClearSlot ? (
          <Button
            className='px-2 py-1 text-[10px]'
            onClick={onClearSlot}
            type='button'
            variant='danger'
          >
            Clear Slot
          </Button>
        ) : null}
        <Button
          className='px-3 py-1 text-[10px]'
          onClick={onQuickLineup}
          type='button'
          variant='primary'
        >
          Quick Lineup
        </Button>
      </div>
    </div>
  )
}
