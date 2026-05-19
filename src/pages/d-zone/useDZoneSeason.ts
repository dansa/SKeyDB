import {useEffect, useState} from 'react'

import {loadDzoneSeasonById, type DzoneSeason} from '@/domain/dzone'

type DZoneSeasonLoadState =
  | {seasonId: string; status: 'loading'}
  | {message: string; seasonId: string; status: 'error'}
  | {season: DzoneSeason; seasonId: string; status: 'loaded'}

export function useDZoneSeason(seasonId: string): DZoneSeasonLoadState {
  const [state, setState] = useState<DZoneSeasonLoadState>({seasonId, status: 'loading'})

  useEffect(() => {
    let cancelled = false

    void loadDzoneSeasonById(seasonId)
      .then((season) => {
        if (cancelled) return
        if (season) {
          setState({season, seasonId, status: 'loaded'})
        } else {
          setState({
            message: `D-Zone season ${seasonId} could not be found.`,
            seasonId,
            status: 'error',
          })
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          message: error instanceof Error ? error.message : 'D-Zone season could not be loaded.',
          seasonId,
          status: 'error',
        })
      })

    return () => {
      cancelled = true
    }
  }, [seasonId])

  return state.seasonId === seasonId ? state : {seasonId, status: 'loading'}
}
