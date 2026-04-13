interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  title?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: readonly SegmentedControlOption<T>[]
  onChange: (nextValue: T) => void
  ariaLabel: string
  className?: string
  buttonClassName?: string
  activeButtonClassName?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  buttonClassName = '',
  activeButtonClassName = '',
}: SegmentedControlProps<T>) {
  return (
    <div aria-label={ariaLabel} className={`segmented-control ${className}`.trim()} role='group'>
      {options.map((option, index) => {
        const isActive = option.value === value
        return (
          <button
            aria-pressed={isActive}
            className={`segmented-control__button ${index === 0 ? 'segmented-control__button-first' : ''} ${buttonClassName} ${
              isActive ? `segmented-control__button-active ${activeButtonClassName}` : ''
            }`.trim()}
            key={option.value}
            onClick={() => {
              onChange(option.value)
            }}
            title={option.title}
            type='button'
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
