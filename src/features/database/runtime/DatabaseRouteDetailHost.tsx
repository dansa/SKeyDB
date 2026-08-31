import {getAwakeners} from '@/domain/awakeners'
import {getOrisons} from '@/domain/orisons'
import {getRelics} from '@/domain/relics'
import {getWheels} from '@/domain/wheels'
import type {DbDetailModalHostProps} from '@/features/database/detail/DbDetailModalHost'
import {DeferredDbDetailModalHost} from '@/features/database/detail/DeferredDbDetailModalHost'

type DatabaseRouteDetailHostProps = Omit<
  DbDetailModalHostProps,
  'awakeners' | 'orisons' | 'relics' | 'wheels'
>

export function DatabaseRouteDetailHost(props: DatabaseRouteDetailHostProps) {
  return (
    <DeferredDbDetailModalHost
      {...props}
      awakeners={getAwakeners()}
      relics={getRelics()}
      orisons={getOrisons()}
      wheels={getWheels()}
    />
  )
}
