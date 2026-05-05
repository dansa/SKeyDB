import type {ReactNode} from 'react'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {DescribedRecord} from '@/domain/description-records'
import type {Posse} from '@/domain/posses'
import type {PosseFullRecord} from '@/domain/posses-full'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
  DATABASE_DETAIL_META_LINK_CLASS,
  DATABASE_DETAIL_META_PRIMARY_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from '@/features/database/internal/database-detail-typography'
import {RichDescription} from '@/features/database/internal/RichDescription'
import {WheelLoreText} from '@/features/database/internal/WheelLoreText'

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
  onOpenArtViewer: () => void
  referenceLayer: ResolvedDatabaseReferenceLayer
  showTagIcons: boolean
  meta?: ReactNode
}

export function SimpleArtifactDetailBody({
  descriptions,
  formulaContext,
  headerIconAsset,
  headerIconClassName = 'object-contain',
  itemName,
  lore,
  meta,
  onOpenArtViewer,
  referenceLayer,
  showTagIcons,
}: SimpleArtifactDetailBodyProps) {
  return (
    <>
      <div className='shrink-0 border-b border-slate-800/75 pb-5'>
        <div className='flex items-center gap-4'>
          {headerIconAsset ? (
            <button
              aria-label={`View full art for ${itemName}`}
              className='h-16 w-16 shrink-0 overflow-visible'
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

      <div className='database-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-6 pl-2'>
        {descriptions.map((entry) => (
          <section className='mt-5' key={entry.record.id}>
            <h4
              className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              {entry.heading}
            </h4>
            <p
              className={`mt-3 max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
              style={getDatabaseDetailBodyStyle()}
            >
              <RichDescription
                formulaContext={formulaContext}
                record={entry.record}
                referenceLayer={referenceLayer}
                showTagIcons={showTagIcons}
              />
            </p>
          </section>
        ))}

        {lore ? (
          <section className='mt-5 border-t border-slate-800/80 pt-4'>
            <h4
              className={DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS}
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              Lore
            </h4>
            <WheelLoreText defaultExpanded lore={lore} previewLineCount={999} />
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
      <span className={DATABASE_DETAIL_META_PRIMARY_CLASS} style={{color: realmAccent}}>
        {realmLabel}
      </span>
      {fullData.ownerAwakenerId && fullData.ownerAwakenerName ? (
        <>
          <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
          <button
            className={DATABASE_DETAIL_META_LINK_CLASS}
            onClick={() => {
              onSelectAwakener?.(
                {id: fullData.ownerAwakenerId ?? '', name: fullData.ownerAwakenerName ?? ''},
                'overview',
              )
            }}
            type='button'
          >
            {fullData.ownerAwakenerName}
          </button>
        </>
      ) : null}
    </p>
  )
}
