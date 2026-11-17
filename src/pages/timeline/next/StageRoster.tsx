import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit} from '@/domain/timeline'

import {resolveTimelineThumbnail} from './timelineNextThumbnails'

export function StageRoster({
  units,
  onOpenDetail,
  compact = false,
}: {
  units: BannerFeaturedUnit[]
  compact?: boolean
  onOpenDetail: (ref: EntityRef) => void
}) {
  return (
    <div
      className={`grid items-start gap-2 ${compact ? 'grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))]'}`}
    >
      {units.map((unit) => {
        const {asset, url} = resolveTimelineThumbnail(unit)
        const image = compact ? url : asset.url
        const content = (
          <>
            <span
              className={`block w-full overflow-hidden rounded-[2px] border border-slate-700/50 bg-slate-950 ${compact ? 'aspect-square' : 'aspect-[3/4]'}`}
            >
              {image ? (
                <img
                  alt=''
                  className={`h-full w-full ${compact || unit.kind === 'posse' ? 'object-contain' : asset.isWheel ? 'scale-[1.12] object-cover object-center' : 'object-cover object-top'}`}
                  loading='lazy'
                  src={image}
                />
              ) : (
                <span className='flex h-full items-center justify-center p-1 text-center text-[0.64rem] text-slate-400'>
                  {asset.label}
                </span>
              )}
            </span>
            <span className='mt-1 w-full text-[0.62rem] leading-tight break-words text-slate-300'>
              {asset.label}
            </span>
          </>
        )
        return asset.detailRef ? (
          <button
            className='group flex min-w-0 flex-col justify-start text-left focus-visible:outline-2 focus-visible:outline-amber-200/60 hover:[&>span:first-child]:border-amber-200/60'
            key={`${unit.kind}:${unit.name}`}
            onClick={() => {
              if (asset.detailRef) onOpenDetail(asset.detailRef)
            }}
            type='button'
          >
            {content}
          </button>
        ) : (
          <figure className='flex flex-col justify-start' key={`${unit.kind}:${unit.name}`}>
            {content}
          </figure>
        )
      })}
    </div>
  )
}
