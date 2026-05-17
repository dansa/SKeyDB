import {useId, type ReactNode} from 'react'

interface FilterRowProps {
  label: string
  children: ReactNode
  controlsClassName?: string
  description?: ReactNode
}

export function FilterRow({children, controlsClassName, description, label}: FilterRowProps) {
  const labelId = useId()
  const descriptionId = description ? `${labelId}-description` : undefined

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={labelId}
      className='flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3'
      role='group'
    >
      <div className='shrink-0 sm:w-20 sm:pt-1.5'>
        <span className='text-[10px] tracking-[0.18em] text-slate-500 uppercase' id={labelId}>
          {label}
        </span>
        {description ? (
          <p className='mt-1 text-[11px] leading-snug text-slate-400' id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
      <div className={controlsClassName ?? 'flex min-w-0 flex-1 flex-wrap items-center gap-1.5'}>
        {children}
      </div>
    </div>
  )
}
