import type {EntityRef} from '@/domain/entities/types'
import type {BannerRateUpGroup} from '@/domain/timeline'

import {StageDisclosure} from './StageDisclosure'
import {StageRoster} from './StageRoster'

export function StageRateUpGroup({
  group,
  onOpenDetail,
}: {
  group: BannerRateUpGroup
  onOpenDetail: (ref: EntityRef) => void
}) {
  const {kind, options, sharedOffBanner} = group
  const units = (names: string[]) => names.map((name) => ({kind, name}))
  return (
    <section className='space-y-4 border-t border-slate-700/40 pt-4'>
      <h3 className='text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
        {options.length > 1
          ? 'Rerun banners'
          : kind === 'wheel'
            ? 'Wheel Awakening'
            : 'Character Awakening'}
      </h3>
      <div
        className={
          sharedOffBanner && options.length > 1 ? 'grid grid-cols-3 gap-x-3 gap-y-2' : 'space-y-3'
        }
      >
        {options.map(({title, rateUp, offBanner}) => (
          <section
            className={`min-w-0 border-b border-slate-700/40 pb-3 ${sharedOffBanner && options.length > 1 ? 'row-span-2 grid grid-rows-subgrid' : 'space-y-2'}`}
            key={title}
          >
            <h4 className='ui-title text-sm text-amber-50'>{title}</h4>
            <div
              className={
                offBanner
                  ? 'grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 max-[374px]:grid-cols-1'
                  : undefined
              }
            >
              <div>
                {offBanner ? (
                  <p className='mb-1 text-xs font-semibold text-amber-200'>Rate-up</p>
                ) : null}
                <StageRoster
                  compact
                  highlighted
                  onOpenDetail={onOpenDetail}
                  units={units([rateUp])}
                />
              </div>
              {offBanner ? (
                <div className='min-w-0 border-l border-slate-700/40 pl-3 max-[374px]:border-t max-[374px]:border-l-0 max-[374px]:pt-2 max-[374px]:pl-0'>
                  <p className='mb-1 text-xs text-slate-300'>
                    Off-banner SSRs ({offBanner.length})
                  </p>
                  <StageRoster
                    compact
                    fiveAcross
                    onOpenDetail={onOpenDetail}
                    units={units(offBanner)}
                  />
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
      {sharedOffBanner ? (
        <StageDisclosure
          className='border-b border-slate-700/40 pb-3'
          label={`${options.length > 1 ? 'Shared off-banner SSRs' : 'Off-banner SSRs'} (${String(sharedOffBanner.length)})`}
        >
          <StageRoster compact onOpenDetail={onOpenDetail} units={units(sharedOffBanner)} />
        </StageDisclosure>
      ) : null}
    </section>
  )
}
