import {useMemo, type ReactNode} from 'react'

import {getRealmLabel, getRealmTint, normalizeRealmId} from '@/domain/factions'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses} from '@/domain/posses'

import {useBuilderStore} from './store/builder-store'
import {selectActiveTeam, selectActiveTeamSlots} from './store/selectors'

const posses = getPosses()
const posseById = new Map(posses.map((p) => [p.id, p]))

interface TeamHeaderProps {
  className?: string
  actions?: ReactNode
  compact?: boolean
  showPosseName?: boolean
}

export function TeamHeader({
  className = '',
  actions,
  compact = false,
  showPosseName = false,
}: TeamHeaderProps) {
  const activeTeam = useBuilderStore(selectActiveTeam)
  const teamSlots = useBuilderStore(selectActiveTeamSlots)

  const realmInfo = useMemo(() => {
    const realms = Array.from(
      new Set(
        teamSlots
          .filter((s): s is typeof s & {realm: string} => Boolean(s.realm))
          .map((s) => normalizeRealmId(s.realm)),
      ),
    ).slice(0, 2)
    return realms.map((id) => ({id, label: getRealmLabel(id), tint: getRealmTint(id)}))
  }, [teamSlots])

  if (!activeTeam) return null

  const posse = activeTeam.posseId ? posseById.get(activeTeam.posseId) : undefined
  const posseAsset = posse ? getPosseAssetById(posse.id) : undefined
  const thumbSize = compact ? 'h-6 w-6' : 'h-7 w-7'
  const nameSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center justify-between px-3 py-1.5 ${className}`}>
      <div className='flex items-center gap-1.5'>
        <h2 className={`${nameSize} font-bold text-slate-100`}>{activeTeam.name}</h2>
        {realmInfo.length > 0 ? (
          <span className='text-[10px]'>
            {realmInfo.map((r, i) => (
              <span key={r.id}>
                <span style={{color: r.tint}}>{r.label}</span>
                {i < realmInfo.length - 1 ? <span className='text-slate-400'> / </span> : null}
              </span>
            ))}
          </span>
        ) : (
          <span className='text-[10px] text-slate-500'>No Realm</span>
        )}
      </div>
      <div className='flex items-center gap-1.5'>
        <span className='text-[9px] text-slate-500'>Posse</span>
        <div className={`${thumbSize} overflow-hidden border border-slate-500/45 bg-slate-800`}>
          {posseAsset ? (
            <img
              alt={posse?.name ?? 'Posse'}
              className='h-full w-full object-cover'
              draggable={false}
              src={posseAsset}
            />
          ) : (
            <span className='flex h-full w-full items-center justify-center text-[7px] text-slate-600'>
              +
            </span>
          )}
        </div>
        {showPosseName && posse ? (
          <span className='text-[10px] text-slate-300'>{posse.name}</span>
        ) : null}
        {actions}
      </div>
    </div>
  )
}
