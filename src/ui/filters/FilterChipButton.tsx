import type {CSSProperties, ReactNode} from 'react'

interface FilterChipButtonProps {
  active: boolean
  ariaLabel?: string
  children: ReactNode
  className?: string
  onClick: () => void
  style?: CSSProperties
}

function chipClass(active: boolean): string {
  return `inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2.5 py-1.5 text-[11px] font-medium leading-none transition-[background-color,border-color,color,box-shadow] duration-200 sm:min-h-8 ${
    active
      ? 'border-amber-300/45 bg-slate-950/62 text-amber-50 shadow-none'
      : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'
  }`
}

export function FilterChipButton({
  active,
  ariaLabel,
  children,
  className = '',
  onClick,
  style,
}: FilterChipButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`${chipClass(active)} ${className} focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}
