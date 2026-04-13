import type {Awakener} from '@/domain/awakeners'

import {AwakenerGridCard} from './AwakenerGridCard'

interface DatabaseGridProps {
  awakeners: Awakener[]
  onSelectAwakener: (id: number) => void
}

export function DatabaseGrid({awakeners, onSelectAwakener}: DatabaseGridProps) {
  if (awakeners.length === 0) {
    return (
      <div className='py-12 text-center text-sm text-slate-400'>
        No awakeners match the current filters.
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'>
      {awakeners.map((awakener) => (
        <AwakenerGridCard awakener={awakener} key={awakener.id} onSelect={onSelectAwakener} />
      ))}
    </div>
  )
}
