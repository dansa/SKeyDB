import type {ReactNode} from 'react'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {DescribedRecord} from '@/domain/description-records'
import type {Posse} from '@/domain/posses'
import type {PosseFullRecord} from '@/domain/posses-full'
import {isPreReleaseAwakenerId} from '@/domain/pre-release'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
  DATABASE_DETAIL_META_PRIMARY_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from '@/features/database/internal/database-detail-typography'
import {RichDescription} from '@/features/database/internal/RichDescription'
import {
  DATABASE_ACCENT_TEXT_CLASS,
  getDatabaseAccentTextStyle,
} from '@/features/database/internal/text-styles'
import {WheelLoreText} from '@/features/database/internal/WheelLoreText'

import {OwnerAwakenerMetaLink} from './OwnerAwakenerMetaLink'
import {PreReleaseDataNotice} from './PreReleaseDataNotice'

interface SimpleArtifactDescriptionEntry {
  heading: string
  record: DescribedRecord
}

interface SimpleArtifactDetailBodyProps {
  descriptions: SimpleArtifactDescriptionEntry[]
  formulaContext: PublicFormulaContext
  headerIconAsset?: string
  headerIconClassName?: string
  itemName: string
  lore?: string
  acquisitionSource?: string
  onOpenArtViewer: () => void
  referenceLayer: ResolvedDatabaseReferenceLayer
  showTagIcons: boolean
  meta?: ReactNode
  ownerAwakenerId?: string
}

export function SimpleArtifactDetailBody({
  descriptions,
  formulaContext,
  headerIconAsset,
  headerIconClassName = 'object-contain',
  itemName,
  lore,
  meta,
  acquisitionSource,
  onOpenArtViewer,
  ownerAwakenerId,
  referenceLayer,
  showTagIcons,
}: SimpleArtifactDetailBodyProps) {
  const trimmedAcquisitionSource = acquisitionSource?.trim()
  return (
    <>
      <div className='shrink-0 pr-5 pb-5 pl-5 md:pl-3'>
        <div className='flex items-center gap-4'>
          {headerIconAsset ? (
            <button
              aria-label={`View full art for ${itemName}`}
              className='size-16 shrink-0 overflow-visible'
              onClick={onOpenArtViewer}
              type='button'
            >
              <img
                alt=''
                className={`h-full w-full ${headerIconClassName}`}
                draggable={false}
                src={headerIconAsset}
              />
            </button>
          ) : null}
          <div className='min-w-0'>
            <h3 className={DATABASE_DETAIL_HEADER_TITLE_CLASS}>{itemName}</h3>
            {meta}
          </div>
        </div>
      </div>

      <div className='database-scrollbar min-h-0 flex-1 overflow-y-auto p-5 pl-5 md:pl-3'>
        {isPreReleaseAwakenerId(ownerAwakenerId) ? <PreReleaseDataNotice /> : null}

        {descriptions.length === 1 && descriptions[0].heading === 'Description' ? (
          <section className='mt-5'>
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
                  formulaContext={formulaContext}
                  record={descriptions[0].record}
                  referenceLayer={referenceLayer}
                  showTagIcons={showTagIcons}
                />
              </p>
            </div>
          </section>
        ) : descriptions.length > 0 ? (
          <section className='mt-5'>
            <h4
              className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              Description
            </h4>
            <div className='mt-3 space-y-3 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
              {descriptions.map((entry, index) => (
                <div
                  key={entry.record.id}
                  className={index > 0 ? 'border-t border-white/5 pt-3' : ''}
                >
                  <span className='mb-1.5 block text-[10px] font-medium tracking-[0.1em] text-slate-400 uppercase'>
                    {entry.heading}
                  </span>
                  <p
                    className={`max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
                    style={getDatabaseDetailBodyStyle()}
                  >
                    <RichDescription
                      formulaContext={formulaContext}
                      record={entry.record}
                      referenceLayer={referenceLayer}
                      showTagIcons={showTagIcons}
                    />
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {trimmedAcquisitionSource ? (
          <section className='mt-5'>
            <h4
              className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              How to Obtain
            </h4>
            <div className='mt-3 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
              <p
                className={`max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
                style={getDatabaseDetailBodyStyle()}
              >
                {trimmedAcquisitionSource}
              </p>
            </div>
          </section>
        ) : null}

        {lore ? (
          <section className='mt-5'>
            <h4
              className={DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS}
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              Lore
            </h4>
            <div className='mt-3 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
              <WheelLoreText full lore={lore} />
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}

export function PosseMeta({
  fullData,
  onSelectAwakener,
  posse,
}: {
  fullData: PosseFullRecord
  posse: Posse
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
}) {
  const realmAccent = getRealmAccent(posse.realm)
  const realmLabel = posse.isFadedLegacy ? 'Faded Legacy' : getRealmLabel(posse.realm)

  return (
    <p className={`${DATABASE_DETAIL_META_ROW_CLASS} ${DATABASE_DETAIL_HEADER_META_CLASS}`}>
      <span
        className={`${DATABASE_DETAIL_META_PRIMARY_CLASS} ${DATABASE_ACCENT_TEXT_CLASS}`}
        style={getDatabaseAccentTextStyle(realmAccent)}
      >
        {realmLabel}
      </span>
      <OwnerAwakenerMetaLink
        onSelectAwakener={onSelectAwakener}
        ownerAwakenerId={fullData.ownerAwakenerId}
        ownerAwakenerName={fullData.ownerAwakenerName}
      />
    </p>
  )
}
