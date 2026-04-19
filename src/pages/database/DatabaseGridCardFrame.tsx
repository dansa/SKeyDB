import type {CSSProperties, ReactNode} from 'react'

interface DatabaseGridCardFrameProps {
  realmAccent: string
  ariaLabel: string
  imageSrc: string | undefined
  imageAlt: string
  imageObjectClassName?: string
  prioritizeImage: boolean
  fadeHeightClass: string
  cornerOverlay?: ReactNode
  children?: ReactNode
  onSelect: () => void
}

export function DatabaseGridCardFrame({
  ariaLabel,
  children,
  cornerOverlay,
  fadeHeightClass,
  imageAlt,
  imageObjectClassName = 'object-cover',
  imageSrc,
  onSelect,
  prioritizeImage,
  realmAccent,
}: DatabaseGridCardFrameProps) {
  return (
    <article className='collection-item-card group/card p-0.5'>
      <div
        className='relative aspect-[5/9] overflow-hidden p-[1px] shadow-[0_8px_20px_rgba(2,6,23,0.24)] transition-[transform,box-shadow] duration-300 group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_14px_30px_rgba(2,6,23,0.34)]'
        style={
          {
            '--realm-accent': realmAccent,
            background: `linear-gradient(180deg, color-mix(in srgb, var(--realm-accent) 92%, white 8%), rgba(71,85,105,0.92))`,
          } as CSSProperties
        }
      >
        <div className='relative h-full w-full overflow-hidden bg-slate-900 transition-colors duration-300'>
          <button
            aria-label={ariaLabel}
            className='absolute inset-0 z-30 cursor-pointer transition-[background-color,box-shadow] duration-300 group-hover/card:bg-white/5 group-hover/card:shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none focus-visible:ring-inset'
            onClick={onSelect}
            type='button'
          />

          {imageSrc ? (
            <img
              alt={imageAlt}
              className={`h-full w-full ${imageObjectClassName}`}
              decoding='async'
              draggable={false}
              fetchPriority={prioritizeImage ? 'high' : 'low'}
              loading={prioritizeImage ? 'eager' : 'lazy'}
              src={imageSrc}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-500'>
              No Image
            </div>
          )}

          {cornerOverlay}

          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/66 via-42% to-transparent ${fadeHeightClass}`}
          />

          {children ? (
            <div className='pointer-events-none absolute right-0 bottom-0 left-0 z-20 px-2.5 pt-12 pb-2.5'>
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
