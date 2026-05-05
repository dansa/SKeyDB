import type {CSSProperties, ReactNode} from 'react'

import {FilterChipButton} from './FilterChipButton'
import {FilterRow} from './FilterRow'

interface ChipOption<TValue extends string> {
  id: TValue
  label: ReactNode
  iconSrc?: string | null
  activeStyle?: CSSProperties
}

interface ChipFilterRowProps<TValue extends string> {
  activeId: TValue
  label: string
  onChange: (next: TValue) => void
  options: readonly ChipOption<TValue>[]
  controlsClassName?: string
  description?: ReactNode
}

export function ChipFilterRow<TValue extends string>({
  activeId,
  controlsClassName,
  description,
  label,
  onChange,
  options,
}: ChipFilterRowProps<TValue>) {
  return (
    <FilterRow controlsClassName={controlsClassName} description={description} label={label}>
      {options.map((option) => (
        <FilterChipButton
          active={activeId === option.id}
          key={option.id}
          onClick={() => {
            onChange(option.id)
          }}
          style={activeId === option.id ? option.activeStyle : undefined}
        >
          {option.iconSrc ? (
            <img
              alt=''
              className='h-3.5 w-3.5 object-contain'
              draggable={false}
              src={option.iconSrc}
            />
          ) : null}
          {option.label}
        </FilterChipButton>
      ))}
    </FilterRow>
  )
}
