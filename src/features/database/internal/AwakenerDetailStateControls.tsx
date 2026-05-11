import type {CSSProperties, ReactNode} from 'react'

import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'

import {DetailLevelSlider} from './DetailLevelSlider'

interface AwakenerDetailStateControlsProps {
  compact?: boolean
  controls: AwakenerDatabaseControls
  selection: AwakenerDatabaseSelection
  onPatchSelection: (nextPartial: Partial<AwakenerDatabaseSelection>) => void
}

function ControlLabel({children}: {children: ReactNode}) {
  return <p className='text-[9px] tracking-wide text-slate-500 uppercase'>{children}</p>
}

function getEnlightenOptionsGridStyle(optionCount: number): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${String(Math.max(optionCount, 1))}, minmax(0, 1fr))`,
  }
}

function SegmentedButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={`min-w-0 border px-1.5 py-1 text-[9px] tracking-wide uppercase transition-colors ${
        active
          ? 'border-amber-200/60 bg-amber-200/12 text-amber-100'
          : 'border-slate-600/35 bg-slate-950/50 text-slate-400 hover:border-slate-400/50 hover:text-slate-200'
      }`}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  )
}

export function AwakenerDetailStateControls({
  compact,
  controls,
  selection,
  onPatchSelection,
}: AwakenerDetailStateControlsProps) {
  return (
    <div className='space-y-2.5'>
      <div className='space-y-1.5'>
        <DetailLevelSlider
          compact={compact}
          label='Awakener Level'
          level={selection.awakenerLevel}
          max={90}
          min={1}
          onChange={(awakenerLevel) => {
            onPatchSelection({awakenerLevel})
          }}
        />
        {controls.hasSoulforgeTalent &&
        controls.soulforgeLevelMin !== null &&
        controls.soulforgeLevelMax !== null ? (
          <DetailLevelSlider
            compact={compact}
            formatValueLabel={(level) => (level === 0 ? 'Off' : `Lv. ${String(level)}`)}
            label='Soulforge'
            level={selection.soulforgeLevel}
            max={controls.soulforgeLevelMax}
            min={controls.soulforgeLevelMin}
            onChange={(soulforgeLevel) => {
              onPatchSelection({soulforgeLevel})
            }}
          />
        ) : null}
        <DetailLevelSlider
          compact={compact}
          label='Skill Level'
          level={selection.skillLevel}
          max={controls.skillLevelMax}
          min={controls.skillLevelMin}
          onChange={(skillLevel) => {
            onPatchSelection({skillLevel})
          }}
        />
      </div>

      <div className='space-y-2'>
        <ControlLabel>Enlighten</ControlLabel>
        <div
          className='grid gap-1.5'
          style={getEnlightenOptionsGridStyle(controls.enlightenOptions.length)}
        >
          {controls.enlightenOptions.map((option) => (
            <SegmentedButton
              active={selection.selectedEnlightenSlot === option.value}
              key={option.label}
              onClick={() => {
                onPatchSelection({selectedEnlightenSlot: option.value})
              }}
            >
              {option.label}
            </SegmentedButton>
          ))}
        </div>
      </div>
    </div>
  )
}
