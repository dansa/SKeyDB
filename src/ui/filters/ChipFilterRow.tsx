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
  defaultId?: TValue
  description?: ReactNode
  resetActiveOnClick?: boolean
  toggleOnContextMenu?: boolean
}

export function ChipFilterRow<TValue extends string>({
  activeId,
  controlsClassName,
  defaultId,
  description,
  label,
  onChange,
  options,
  resetActiveOnClick = true,
  toggleOnContextMenu = true,
}: ChipFilterRowProps<TValue>) {
  const fallbackDefaultId = defaultId ?? options[0]?.id
  const getToggledValue = (optionId: TValue) =>
    activeId === optionId && fallbackDefaultId ? fallbackDefaultId : optionId

  return (
    <FilterRow controlsClassName={controlsClassName} description={description} label={label}>
      {options.map((option) => (
        <FilterChipButton
          active={activeId === option.id}
          key={option.id}
          onClick={() => {
            onChange(resetActiveOnClick ? getToggledValue(option.id) : option.id)
          }}
          onContextMenu={
            toggleOnContextMenu
              ? (event) => {
                  event.preventDefault()
                  onChange(getToggledValue(option.id))
                }
              : undefined
          }
          style={activeId === option.id ? option.activeStyle : undefined}
        >
          {option.iconSrc ? (
            <img
              alt=''
              className='size-3.5 object-contain'
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
