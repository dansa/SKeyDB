import {useState} from 'react'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {WheelDatabaseDescriptionRecord} from '@/domain/description-records'
import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import {isPreReleaseAwakenerId} from '@/domain/pre-release'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {buildWheelMainstatHover} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {OwnerAwakenerMetaLink} from '@/features/database/detail/OwnerAwakenerMetaLink'
import {PreReleaseDataNotice} from '@/features/database/detail/PreReleaseDataNotice'

import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_META_PRIMARY_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  DATABASE_DETAIL_VALUE_CLASS,
  DATABASE_DETAIL_VALUE_LABEL_CLASS,
  DATABASE_DETAIL_VALUE_ROW_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
  getDatabaseDetailValueStyle,
} from './database-detail-typography'
import {RichDescription} from './RichDescription'
import {DATABASE_ACCENT_TEXT_CLASS, getDatabaseAccentTextStyle} from './text-styles'
import {WheelEnhanceControl} from './WheelEnhanceControl'
import {WheelLoreText} from './WheelLoreText'

interface WheelDetailContentProps {
  wheel: Wheel
  fullData: WheelFullRecord
  descriptionRank: number
  enhanceLevel: number
  mainstatValue: string
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  showTagIcons?: boolean
  wheelDescriptionRecord: WheelDatabaseDescriptionRecord
  onEnhanceLevelChange: (level: number) => void
  mobileArtwork?: React.ReactNode
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
}

export function WheelDetailContent({
  descriptionRank,
  enhanceLevel,
  fullData,
  formulaContext,
  mainstatValue,
  mobileArtwork,
  onEnhanceLevelChange,
  onSelectAwakener,
  referenceLayer,
  showTagIcons = true,
  wheel,
  wheelDescriptionRecord,
}: WheelDetailContentProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'lore'>('description')
  const realmLabel = getRealmLabel(wheel.realm)
  const realmAccent = getRealmAccent(wheel.realm)
  const mainstatLabel = getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const mainstatHover = buildWheelMainstatHover(fullData.mainstatSeriesKey, enhanceLevel)
  const ownerAwakenerId = wheel.ownerAwakenerId
  const ownerName = wheel.ownerAwakenerName ?? wheel.awakener
  const lore = fullData.lore ?? null

  return (
    <div className='flex h-full min-h-0 max-w-3xl flex-col' key={wheel.id}>
      <div className='shrink-0 pr-5 pb-4 pl-5 md:pl-3'>
        <div className='flex items-center gap-4 md:block'>
          {mobileArtwork ? <div className='shrink-0 md:hidden'>{mobileArtwork}</div> : null}
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='ui-title text-2xl font-bold tracking-wide text-amber-100 sm:text-3xl'>
                {wheel.name}
              </h3>
            </div>
            <p className={`${DATABASE_DETAIL_META_ROW_CLASS} ${DATABASE_DETAIL_HEADER_META_CLASS}`}>
              <span className={DATABASE_DETAIL_META_PRIMARY_CLASS}>{wheel.rarity}</span>
              <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
              <span
                className={DATABASE_ACCENT_TEXT_CLASS}
                style={getDatabaseAccentTextStyle(realmAccent)}
              >
                {realmLabel}
              </span>
              <OwnerAwakenerMetaLink
                onSelectAwakener={onSelectAwakener}
                ownerAwakenerId={ownerAwakenerId}
                ownerAwakenerName={ownerName}
              />
            </p>
          </div>
        </div>

        {lore && (
          <div className='mt-4 flex w-full gap-0.5' role='tablist'>
            <button
              aria-selected={activeTab === 'description'}
              className={`flex-1 px-4 py-2 text-center text-[10px] tracking-wide uppercase transition-colors sm:text-[11px] ${
                activeTab === 'description'
                  ? 'border-b-2 border-amber-200/70 text-amber-100'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => {
                setActiveTab('description')
              }}
              role='tab'
              type='button'
            >
              Description
            </button>
            <button
              aria-selected={activeTab === 'lore'}
              className={`flex-1 px-4 py-2 text-center text-[10px] tracking-wide uppercase transition-colors sm:text-[11px] ${
                activeTab === 'lore'
                  ? 'border-b-2 border-amber-200/70 text-amber-100'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => {
                setActiveTab('lore')
              }}
              role='tab'
              type='button'
            >
              Lore
            </button>
          </div>
        )}
      </div>

      <div
        className='database-scrollbar mt-0 min-h-0 flex-1 overflow-y-auto p-5 pl-5 md:pl-3'
        data-wheel-detail-scroll=''
      >
        {isPreReleaseAwakenerId(ownerAwakenerId) ? <PreReleaseDataNotice /> : null}

        {activeTab === 'description' && (
          <div className='animate-fade-in space-y-5 duration-200'>
            <section className='space-y-4 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
              <div className='flex flex-wrap items-center gap-3'>
                {mainstatIcon ? (
                  <span className='inline-flex size-9 items-center justify-center border border-amber-200/14 bg-slate-950/72'>
                    <img
                      alt=''
                      className='size-5 object-contain opacity-90'
                      draggable={false}
                      src={mainstatIcon}
                    />
                  </span>
                ) : null}
                <div className='min-w-0'>
                  <div
                    className={DATABASE_DETAIL_VALUE_ROW_CLASS}
                    style={getDatabaseDetailValueStyle()}
                  >
                    <span className={DATABASE_DETAIL_VALUE_LABEL_CLASS}>{mainstatLabel}</span>
                    <span className={DATABASE_DETAIL_VALUE_CLASS} title={mainstatHover}>
                      {mainstatValue}
                    </span>
                  </div>
                </div>
              </div>

              <WheelEnhanceControl enhanceLevel={enhanceLevel} onChange={onEnhanceLevelChange} />
            </section>

            <section>
              <h4
                className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
                style={getDatabaseDetailSectionHeadingStyle()}
              >
                Description
              </h4>
              <div className='mt-3 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
                <p
                  className={`max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
                  style={getDatabaseDetailBodyStyle()}
                >
                  <RichDescription
                    descriptionRank={descriptionRank}
                    formulaContext={formulaContext}
                    record={wheelDescriptionRecord}
                    referenceLayer={referenceLayer}
                    showTagIcons={showTagIcons}
                  />
                </p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'lore' && lore && (
          <div className='animate-fade-in duration-200'>
            <section>
              <h4
                className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
                style={getDatabaseDetailSectionHeadingStyle()}
              >
                Lore
              </h4>
              <div className='mt-3 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
                <WheelLoreText full lore={lore} />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
