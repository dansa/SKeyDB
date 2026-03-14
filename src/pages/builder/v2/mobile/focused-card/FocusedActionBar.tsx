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
      <button
        className='border border-slate-500/45 px-2 py-1 text-[10px] text-slate-400'
        onClick={onBack}
        type='button'
      >
        ← Team
      </button>
      <div className='flex items-center gap-2'>
        {canClearSlot ? (
          <button
            className='border border-rose-300/35 px-2 py-1 text-[10px] text-rose-200'
            onClick={onClearSlot}
            type='button'
          >
            Clear Slot
          </button>
        ) : null}
        <button
          className='border border-amber-500/50 px-3 py-1 text-[10px] text-amber-400'
          onClick={onQuickLineup}
          type='button'
        >
          Quick Lineup
        </button>
      </div>
    </div>
  )
}
