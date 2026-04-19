import type {ResolvedAwakenerDatabaseReferenceLayer} from '@/domain/awakeners-database-view'
import type {WheelDatabaseDescriptionRecord} from '@/domain/description-records'
import {getRealmLabel, getRealmTint} from '@/domain/factions'
import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullV1Record} from '@/domain/wheels-full-v1'

import {RichDescription} from './RichDescription'
import {WheelEnhanceControl} from './WheelEnhanceControl'
import {WheelLoreText} from './WheelLoreText'

interface WheelDetailContentProps {
  wheel: Wheel
  fullDataV1: WheelFullV1Record
  descriptionRank: number
  enhanceLevel: number
  mainstatValue: string
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  wheelDescriptionRecord: WheelDatabaseDescriptionRecord
  onEnhanceLevelChange: (level: number) => void
  mobileArtwork?: React.ReactNode
  onSelectAwakener?: (
    awakener: {id: number; name: string},
    tab?: 'overview' | 'cards' | 'builds' | 'teams',
  ) => void
}

export function WheelDetailContent({
  descriptionRank,
  enhanceLevel,
  fullDataV1,
  mainstatValue,
  mobileArtwork,
  onEnhanceLevelChange,
  onSelectAwakener,
  referenceLayer,
  wheel,
  wheelDescriptionRecord,
}: WheelDetailContentProps) {
  const realmLabel = getRealmLabel(wheel.realm)
  const realmTint = getRealmTint(wheel.realm)
  const mainstatLabel = getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const ownerAwakenerId = wheel.ownerAwakenerId
  const ownerName = wheel.ownerAwakenerName ?? wheel.awakener
  const displayOwnerName = ownerName ? formatAwakenerNameForUi(ownerName) : null
  const lore = fullDataV1.lore ?? null

  return (
    <div className='flex h-full min-h-0 max-w-3xl flex-col'>
      <div className='shrink-0 border-b border-slate-800/75 pr-12 pb-5 md:pr-14'>
        <div className='flex items-center gap-4 md:block'>
          {mobileArtwork ? <div className='shrink-0 md:hidden'>{mobileArtwork}</div> : null}
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='ui-title text-[2rem] leading-none text-amber-100 md:text-3xl'>
                {wheel.name}
              </h3>
            </div>
            <p className='mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-[0.18em] text-slate-500 uppercase'>
              <span className='text-amber-100/90'>{wheel.rarity}</span>
              <span className='text-slate-700'>•</span>
              <span style={{color: realmTint}}>{realmLabel}</span>
              {ownerAwakenerId && ownerName && displayOwnerName ? (
                <>
                  <span className='text-slate-700'>•</span>
                  <button
                    className='cursor-pointer tracking-normal text-amber-100 normal-case transition-colors hover:text-amber-50'
                    onClick={() => {
                      onSelectAwakener?.({id: ownerAwakenerId, name: ownerName}, 'overview')
                    }}
                    type='button'
                  >
                    {displayOwnerName}
                  </button>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div
        className='database-scrollbar mt-0 min-h-0 flex-1 overflow-y-auto pr-1 pb-6 pl-2'
        data-wheel-detail-scroll=''
      >
        <section className='space-y-4 border-b border-slate-800/75 py-4'>
          <div className='flex flex-wrap items-center gap-3'>
            {mainstatIcon ? (
              <span className='inline-flex h-9 w-9 items-center justify-center border border-amber-200/14 bg-slate-950/72'>
                <img
                  alt=''
                  className='h-5 w-5 object-contain opacity-90'
                  draggable={false}
                  src={mainstatIcon}
                />
              </span>
            ) : null}
            <div className='min-w-0'>
              <div className='flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] text-slate-300'>
                <span className='font-["Droid_Serif"] text-base text-slate-200'>
                  {mainstatLabel}
                </span>
                <span className='font-["Droid_Serif"] text-base text-amber-100'>
                  {mainstatValue}
                </span>
              </div>
            </div>
          </div>

          <WheelEnhanceControl enhanceLevel={enhanceLevel} onChange={onEnhanceLevelChange} />
        </section>

        <section className='mt-5'>
          <h4 className='ui-title text-[11px] tracking-[0.22em] text-amber-200/88 uppercase'>
            Description
          </h4>
          <p className='mt-3 max-w-[68ch] text-[15px] leading-[1.7] text-slate-300'>
            <RichDescription
              descriptionRank={descriptionRank}
              record={wheelDescriptionRecord}
              referenceLayer={referenceLayer}
            />
          </p>
        </section>

        {lore ? (
          <section className='mt-5 border-t border-slate-800/80 pt-4'>
            <h4 className='ui-title text-[11px] tracking-[0.22em] text-slate-400 uppercase'>
              Lore
            </h4>
            <WheelLoreText lore={lore} />
          </section>
        ) : null}
      </div>
    </div>
  )
}
