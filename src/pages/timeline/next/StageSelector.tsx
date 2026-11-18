import type {EntityRef} from '@/domain/entities/types'
import type {BannerPoolSlot} from '@/domain/timeline'

import {StageDisclosure} from './StageDisclosure'
import {StageRoster} from './StageRoster'

export function StageSelector({
  slots,
  onOpenDetail,
}: {
  slots: BannerPoolSlot[]
  onOpenDetail: (ref: EntityRef) => void
}) {
  return (
    <section className='border-t border-slate-700/40 pt-4'>
      <h3 className='mb-2 text-[0.65rem] font-extrabold text-slate-400 uppercase'>
        Eligible picks
      </h3>
      <div className='divide-y divide-slate-700/40'>
        {slots.map(({label, pool, linked}) => (
          <StageDisclosure key={label} label={`${label ?? ''} (${String(pool.length)})`}>
            <ul className='grid grid-cols-[repeat(auto-fill,minmax(min(9rem,100%),1fr))] gap-2 pb-3'>
              {pool.map((unit) => (
                <li className='min-w-0 border border-slate-700/40 p-2' key={unit.name}>
                  <StageRoster
                    compact
                    onOpenDetail={onOpenDetail}
                    units={linked ? [unit, {name: unit.name, kind: 'wheel-auto'}] : [unit]}
                  />
                </li>
              ))}
            </ul>
          </StageDisclosure>
        ))}
      </div>
    </section>
  )
}
