import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {WheelDatabaseDescriptionRecord} from '@/domain/description-records'
import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {buildWheelMainstatHover} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {OwnerAwakenerMetaLink} from '@/features/database/detail/OwnerAwakenerMetaLink'

import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
  DATABASE_DETAIL_META_PRIMARY_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS,
  DATABASE_DETAIL_VALUE_CLASS,
  DATABASE_DETAIL_VALUE_LABEL_CLASS,
  DATABASE_DETAIL_VALUE_ROW_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
  getDatabaseDetailValueStyle,
} from './database-detail-typography'
import {DatabaseDetailTagStrip} from './DatabaseDetailTagStrip'
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
  expandLoreByDefault?: boolean
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
  expandLoreByDefault = false,
  referenceLayer,
  showTagIcons = true,
  wheel,
  wheelDescriptionRecord,
}: WheelDetailContentProps) {
  const realmLabel = getRealmLabel(wheel.realm)
  const realmAccent = getRealmAccent(wheel.realm)
  const mainstatLabel = getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const mainstatHover = buildWheelMainstatHover(fullData.mainstatSeriesKey, enhanceLevel)
  const ownerAwakenerId = wheel.ownerAwakenerId
  const ownerName = wheel.ownerAwakenerName ?? wheel.awakener
  const lore = fullData.lore ?? null

  return (
    <div className='flex h-full min-h-0 max-w-3xl flex-col'>
      <div className='shrink-0 border-b border-slate-800/75 pr-20 pb-5'>
        <div className='flex items-center gap-4 md:block'>
          {mobileArtwork ? <div className='shrink-0 md:hidden'>{mobileArtwork}</div> : null}
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className={DATABASE_DETAIL_HEADER_TITLE_CLASS}>{wheel.name}</h3>
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
            <DatabaseDetailTagStrip
              className='mt-1.5 max-w-xl'
              itemKey={wheel.id}
              tags={fullData.searchTags}
            />
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

        <section className='mt-5'>
          <h4
            className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
            style={getDatabaseDetailSectionHeadingStyle()}
          >
            Description
          </h4>
          <p
            className={`mt-3 max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
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
        </section>

        {lore ? (
          <section className='mt-5 border-t border-slate-800/80 pt-4'>
            <h4
              className={DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS}
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              Lore
            </h4>
            <WheelLoreText
              defaultExpanded={expandLoreByDefault}
              key={`${wheel.id}:${expandLoreByDefault ? 'expanded' : 'collapsed'}`}
              lore={lore}
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}
