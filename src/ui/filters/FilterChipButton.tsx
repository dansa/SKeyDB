import type {CSSProperties, ReactNode} from 'react'

interface FilterChipButtonProps {
  active: boolean
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
}

function chipClass(active: boolean): string {
  return `inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2.5 py-1.5 text-[11px] font-medium leading-none transition-[background-color,border-color,color,box-shadow] duration-200 sm:min-h-8 ${
    active
      ? 'border-amber-300/42 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(245,158,11,0.07))] text-amber-50 shadow-[inset_0_1px_0_rgba(255,251,235,0.06)]'
      : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'
  }`
}

export function FilterChipButton({active, children, onClick, style}: FilterChipButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={`${chipClass(active)} focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}
