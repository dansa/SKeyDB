import { getFactionTint } from '../../domain/factions'
import type { TeamSlot } from './types'

type CardWheelZoneProps = {
  slot: TeamSlot
  interactive: boolean
  wheelKeyPrefix: string
  activeWheelIndex?: number | null
  onWheelSlotClick?: (wheelIndex: number) => void
}

export function CardWheelZone({ slot, interactive, wheelKeyPrefix, activeWheelIndex = null, onWheelSlotClick }: CardWheelZoneProps) {
  const factionColor = slot.faction ? getFactionTint(slot.faction) : undefined

  return (
    <div className="builder-card-wheel-zone absolute inset-x-0 bottom-0 z-20 p-2">
      <p className="text-xs text-slate-200">
        Lv.{slot.level ?? 1}{' '}
        <span className="ml-1 text-[10px]" style={factionColor ? { color: factionColor } : undefined}>
          {slot.faction ?? ''}
        </span>
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {slot.wheels.map((wheelId, index) =>
          interactive ? (
            <button
              aria-label={wheelId ? `Edit wheel ${index + 1}` : `Set wheel ${index + 1}`}
              className={`wheel-tile group/wheel relative z-20 aspect-[72/110] bg-slate-700/30 p-[1px] ${
                activeWheelIndex === index ? 'wheel-tile-active' : ''
              }`}
              key={`${wheelKeyPrefix}-wheel-${index}`}
              onClick={() => onWheelSlotClick?.(index)}
              type="button"
            >
              <span className="absolute inset-0 border border-slate-200/45" />
              {wheelId ? (
                <span className="absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]" />
              ) : (
                <span className="absolute inset-[2px] border border-slate-700/70 bg-slate-900/60">
                  <span className="sigil-placeholder sigil-placeholder-wheel" />
                </span>
              )}
            </button>
          ) : (
            <div className="wheel-tile relative z-20 aspect-[72/110] bg-slate-700/30 p-[1px]" key={`${wheelKeyPrefix}-wheel-${index}`}>
              <span className="absolute inset-0 border border-slate-200/45" />
              {wheelId ? (
                <span className="absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]" />
              ) : (
                <span className="absolute inset-[2px] border border-slate-700/70 bg-slate-900/60">
                  <span className="sigil-placeholder sigil-placeholder-wheel" />
                </span>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
