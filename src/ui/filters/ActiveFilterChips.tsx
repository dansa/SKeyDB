export interface ActiveFilterChip {
  key: string
  label: string
  onClear: () => void
}

interface ActiveFilterChipsProps {
  chips: readonly ActiveFilterChip[]
  onResetAll: () => void
}

export function ActiveFilterChips({chips, onResetAll}: ActiveFilterChipsProps) {
  if (chips.length === 0) {
    return null
  }

  return (
    <div className='flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px]'>
      <span className='text-[10px] tracking-[0.16em] text-slate-500 uppercase'>Active</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          aria-label={`Remove ${chip.label} filter`}
          className='inline-flex min-h-7 items-center gap-1.5 rounded-[2px] border border-amber-300/42 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(245,158,11,0.07))] px-2 py-0.5 text-amber-50 transition-colors hover:border-amber-200/70 hover:bg-[linear-gradient(180deg,rgba(251,191,36,0.22),rgba(245,158,11,0.1))] focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
          onClick={chip.onClear}
          type='button'
        >
          <span className='truncate'>{chip.label}</span>
          <span aria-hidden='true' className='text-amber-100/80'>
            ×
          </span>
        </button>
      ))}
      <button
        className='ml-1 text-[11px] text-slate-400 underline-offset-2 transition-colors hover:text-amber-200 hover:underline focus-visible:text-amber-200 focus-visible:underline focus-visible:outline-none'
        onClick={onResetAll}
        type='button'
      >
        Reset all
      </button>
    </div>
  )
}
