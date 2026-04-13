import {useCallback} from 'react'

import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {getColoredMainstatIcon} from '@/domain/mainstats'
import {getRelicPortraitAssetByAssetId} from '@/domain/relic-assets'
import {getPortraitRelicByAwakenerIngameId} from '@/domain/relics'
import {RichDescription} from '@/pages/database/components/RichText/RichDescription'
import {scaledFontStyle} from '@/pages/database/utils/font-scale'
import {
  DATABASE_ITEM_NAME_CLASS,
  DATABASE_SECTION_TITLE_CLASS,
} from '@/pages/database/utils/text-styles'

import {DetailSection} from './DetailSection'

type AwakenerDetailCardsProps = Readonly<{
  awakener: Awakener
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
  realmTint?: string
}>

export function AwakenerDetailCards({
  awakener,
  fullData,
  stats,
  cardNames,
  skillLevel,
  realmTint,
}: AwakenerDetailCardsProps) {
  const renderDescription = useCallback(
    (description: string) => (
      <RichDescription
        cardNames={cardNames}
        fullData={fullData}
        skillLevel={skillLevel}
        stats={stats}
        text={description}
      />
    ),
    [cardNames, fullData, skillLevel, stats],
  )

  if (!fullData) {
    return <p className='py-4 text-xs text-slate-400'>Loading card data...</p>
  }

  const {exalt, over_exalt} = fullData.exalts
  const aliemusIcon = getColoredMainstatIcon('ALIEMUS_REGEN')
  const baseAliemus = stats?.BaseAliemus ? Number.parseInt(stats.BaseAliemus, 10) : 100

  const exaltItems = [
    {
      key: 'exalt',
      label: (
        <span className='inline-flex items-center gap-1.5 text-slate-300'>
          {aliemusIcon && (
            <img
              alt=''
              aria-hidden='true'
              className='h-[1.3em] w-[1.3em] object-contain'
              draggable={false}
              src={aliemusIcon}
            />
          )}
          <span className='font-medium text-amber-200/90'>{baseAliemus}</span>
        </span>
      ),
      rightLabel: exalt.label ?? 'Exalt',
      name: exalt.name,
      description: exalt.description,
    },
    {
      key: 'over_exalt',
      label: (
        <span className='inline-flex items-center gap-1.5 text-slate-300'>
          {aliemusIcon && (
            <img
              alt=''
              aria-hidden='true'
              className='h-[1.3em] w-[1.3em] object-contain'
              draggable={false}
              src={aliemusIcon}
            />
          )}
          <span className='font-medium text-amber-200/90'>{baseAliemus * 2}</span>
        </span>
      ),
      rightLabel: over_exalt.label ?? 'Over-Exalt',
      name: over_exalt.name,
      nameColor: '#bb636d',
      description: over_exalt.description,
    },
  ]

  const cardEntries = Object.entries(fullData.cards)
    .map(([key, card]) => ({key, card}))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, {numeric: true}))

  const portraitRelic = getPortraitRelicByAwakenerIngameId(awakener.ingameId)
  const portraitRelicAsset = portraitRelic
    ? getRelicPortraitAssetByAssetId(portraitRelic.assetId)
    : undefined

  return (
    <div className='space-y-4'>
      <DetailSection
        items={exaltItems}
        realmTint={realmTint}
        renderDescription={renderDescription}
        title='Exalts'
      />

      <div>
        <h4
          className={DATABASE_SECTION_TITLE_CLASS}
          style={{...scaledFontStyle(20), color: realmTint}}
        >
          Command Cards
        </h4>
        <div className='flex flex-col gap-y-3 pt-0 pb-2'>
          {cardEntries.map(({key, card}) => {
            const isRouse = card.label ? card.label.toLowerCase() === 'rouse' : key === 'C1'

            return (
              <div className='border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm' key={key}>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex min-w-0 items-center gap-2.5'>
                    <span
                      className='inline-flex shrink-0 items-center gap-1.5 text-slate-300'
                      style={scaledFontStyle(12)}
                    >
                      <img
                        alt=''
                        aria-hidden='true'
                        className='h-[1.3em] w-[1.3em] object-contain opacity-90'
                        draggable={false}
                        src={costIcon}
                      />
                      <span className='font-medium' style={{color: '#ededed'}}>
                        {card.cost}
                      </span>
                    </span>
                    <span className='shrink-0 text-slate-600'>·</span>
                    <span
                      className={DATABASE_ITEM_NAME_CLASS}
                      style={{
                        ...scaledFontStyle(12),
                        color: isRouse ? '#ededed' : '#aebfd8',
                      }}
                    >
                      {card.name}
                    </span>
                  </div>
                  <span className='shrink-0 text-slate-500 italic' style={scaledFontStyle(10)}>
                    {card.label ?? (isRouse ? 'Rouse' : key)}
                  </span>
                </div>
                <div className='my-2 h-px w-full bg-linear-to-r from-white/8 via-white/3 to-transparent' />
                <div
                  className='mt-1.5 pl-2 leading-relaxed text-slate-400'
                  style={scaledFontStyle(12)}
                >
                  {renderDescription(card.description)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4
          className={DATABASE_SECTION_TITLE_CLASS}
          style={{...scaledFontStyle(20), color: realmTint}}
        >
          Dimensional Image
        </h4>
        {portraitRelic ? (
          <div className='pt-1 pb-2'>
            <div className='flex items-start gap-3 border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>
              <div className='h-16 w-16 shrink-0 overflow-hidden'>
                {portraitRelicAsset ? (
                  <img
                    alt={`${portraitRelic.name} icon`}
                    className='h-full w-full object-cover object-center'
                    draggable={false}
                    src={portraitRelicAsset}
                  />
                ) : (
                  <div className='h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(125,165,215,0.2),rgba(8,13,25,0.95)_70%)]' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
                  {renderDescription(portraitRelic.description)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className='px-4 pb-3 text-xs text-slate-400'>
            No dimensional image linked yet for this awakener.
          </p>
        )}
      </div>
    </div>
  )
}
