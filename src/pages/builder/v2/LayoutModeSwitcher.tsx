import type {LayoutMode, LayoutOverride} from './useBuilderLayoutMode'

interface LayoutModeSwitcherProps {
  layoutOverride: LayoutOverride
  detectedMode: LayoutMode
  onOverrideChange: (override: LayoutOverride) => void
}

const options: {id: LayoutOverride; label: string}[] = [
  {id: 'auto', label: 'Auto'},
  {id: 'desktop', label: 'Desktop'},
  {id: 'tablet', label: 'Tablet'},
  {id: 'mobile', label: 'Mobile'},
]

export function LayoutModeSwitcher({
  layoutOverride,
  detectedMode,
  onOverrideChange,
}: LayoutModeSwitcherProps) {
  return (
    <div className='flex items-center gap-1'>
      {options.map((option) => {
        const isActive = layoutOverride === option.id
        const label = option.id === 'auto' ? `Auto (${detectedMode})` : option.label

        return (
          <button
            aria-pressed={isActive}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-slate-700 text-amber-100'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            key={option.id}
            onClick={(event) => {
              event.currentTarget.blur()
              onOverrideChange(option.id)
            }}
            type='button'
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
