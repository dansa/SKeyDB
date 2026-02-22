import { getAwakenerCardAsset, getAwakenerPortraitAsset } from '../../domain/awakener-assets'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getWheelAssetById } from '../../domain/wheel-assets'
import { CardWheelZone } from './CardWheelZone'
import type { TeamSlot } from './types'

export function PickerAwakenerGhost({ awakenerName }: { awakenerName: string }) {
  const displayName = formatAwakenerNameForUi(awakenerName)
  const portraitAsset = getAwakenerPortraitAsset(awakenerName)

  return (
    <div className="w-[72px] border border-slate-400/65 bg-slate-900/90 p-0.5 text-left shadow-[0_6px_20px_rgba(2,6,23,0.45)]">
      <div className="aspect-square overflow-hidden border border-slate-300/45 bg-slate-900/70">
        {portraitAsset ? (
          <img alt={`${displayName} portrait`} className="h-full w-full object-cover" src={portraitAsset} />
        ) : (
          <span className="relative block h-full w-full">
            <span className="sigil-placeholder" />
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-[10px] text-slate-100">{displayName}</p>
    </div>
  )
}

export function TeamCardGhost({ slot, removeIntent = false }: { slot: TeamSlot | undefined; removeIntent?: boolean }) {
  if (!slot?.awakenerName) {
    return null
  }

  const displayName = formatAwakenerNameForUi(slot.awakenerName)
  const cardAsset = getAwakenerCardAsset(slot.awakenerName)

  return (
    <article
      className={`relative aspect-[25/56] w-[96px] border bg-slate-900/90 shadow-[0_8px_24px_rgba(2,6,23,0.5)] ${
        removeIntent ? 'border-rose-300/75' : 'border-slate-400/70'
      }`}
    >
      {cardAsset ? <img alt="" className="absolute inset-0 h-full w-full object-cover object-top" src={cardAsset} /> : null}
      <div
        className={`builder-card-bottom-shade pointer-events-none absolute inset-0 ${
          removeIntent ? 'brightness-[0.55] saturate-[0.45]' : ''
        }`}
      />
      {removeIntent ? (
        <div className="pointer-events-none absolute inset-0 z-20 bg-slate-950/58">
          <span className="sigil-placeholder sigil-placeholder-card sigil-placeholder-no-plus sigil-placeholder-remove" />
          <span className="sigil-remove-x" />
        </div>
      ) : null}
      <div className="builder-card-name-wrap pointer-events-none absolute inset-x-0 top-0 px-2 pt-1 pb-[18%]">
        <p className="builder-card-name builder-card-name-ghost ui-title text-slate-100">{displayName}</p>
      </div>
      {!removeIntent ? <CardWheelZone interactive={false} slot={slot} wheelKeyPrefix="ghost" /> : null}
    </article>
  )
}

export function PickerWheelGhost({ wheelId }: { wheelId: string }) {
  const wheelAsset = getWheelAssetById(wheelId)

  return (
    <div className="w-[62px] border border-slate-400/65 bg-slate-900/90 p-0.5 shadow-[0_6px_20px_rgba(2,6,23,0.45)]">
      <div className="relative aspect-[75/113] overflow-hidden border border-slate-300/45 bg-slate-900/70">
        {wheelAsset ? (
          <img alt={`${wheelId} wheel`} className="builder-card-wheel-image h-full w-full object-cover" src={wheelAsset} />
        ) : (
          <span className="relative block h-full w-full">
            <span className="sigil-placeholder sigil-placeholder-wheel" />
          </span>
        )}
      </div>
    </div>
  )
}

export function TeamWheelGhost({ wheelId, removeIntent = false }: { wheelId: string; removeIntent?: boolean }) {
  const wheelAsset = getWheelAssetById(wheelId)

  return (
    <div
      className={`w-[62px] border bg-slate-900/95 p-0.5 shadow-[0_8px_24px_rgba(2,6,23,0.5)] ${
        removeIntent ? 'border-rose-300/75' : 'border-slate-400/70'
      }`}
    >
      <div className="relative aspect-[75/113] overflow-hidden border border-slate-300/45 bg-slate-900/70">
        {wheelAsset ? (
          <img
            alt={`${wheelId} wheel`}
            className={`builder-card-wheel-image h-full w-full object-cover ${removeIntent ? 'brightness-[0.55] saturate-[0.45]' : ''}`}
            src={wheelAsset}
          />
        ) : (
          <span className="relative block h-full w-full">
            <span className="sigil-placeholder sigil-placeholder-wheel" />
          </span>
        )}
        {removeIntent ? (
          <span className="pointer-events-none absolute inset-0 z-20 bg-slate-950/58">
            <span className="sigil-placeholder sigil-placeholder-wheel sigil-placeholder-no-plus sigil-placeholder-remove" />
            <span className="sigil-remove-x" />
          </span>
        ) : null}
      </div>
    </div>
  )
}
