import {FaArrowsRotate, FaShop} from 'react-icons/fa6'

import type {
  EventEntry,
  TimelineMissionReward,
  TimelineRewardGroup,
  TimelineRewardItem,
} from '@/domain/timeline'
import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {getNotableLoginDays} from './loginCalendar'
import {RewardPreview} from './RewardPreview'
import {StageDisclosure} from './StageDisclosure'
import {getRewardArt} from './timelineRewardArt'

function preview(art: ReturnType<typeof getRewardArt>) {
  return {
    image: art?.previewImage ?? art?.icon,
    large: art?.highlight,
    description: art?.description,
  }
}

function getGroupKind(title: string | undefined) {
  if (!title) return undefined
  if (/limited stock$/i.test(title)) return 'stock'
  if (/^repeatable\b/i.test(title)) return 'repeatable'
  return undefined
}

function getMoreLabel(group: TimelineRewardGroup, remaining: number) {
  if (group.choiceCount)
    return `Choice pool (${String(remaining)}) · pick ${String(group.choiceCount)}`
  return getGroupKind(group.title) === 'stock'
    ? `More stock (${String(remaining)})`
    : `More rewards (${String(remaining)})`
}

function ClaimSchedule({claims}: {claims: NonNullable<TimelineRewardGroup['claims']>}) {
  return (
    <StageDisclosure className='mt-2 border-t border-slate-700/40' label='Paid claim schedule'>
      <p className='pb-2 text-xs text-slate-300'>
        The first reward unlocks on purchase. The rest unlock on the dates below.
      </p>
      <ol className='divide-y divide-slate-700/40'>
        {claims.map((claim) => (
          <li className='grid grid-cols-[5rem_minmax(0,1fr)] gap-2 py-2' key={claim.label}>
            <span className='py-1 text-xs font-semibold text-slate-200'>{claim.label}</span>
            <div>
              {claim.items.map((item) => (
                <RewardLine item={item} key={item.name} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </StageDisclosure>
  )
}

function withOccurrenceKeys<T>(items: T[], nameOf: (item: T) => string) {
  const counts = new Map<string, number>()
  return items.map((item) => {
    const name = nameOf(item)
    const count = (counts.get(name) ?? 0) + 1
    counts.set(name, count)
    return {item, key: `${name}:${String(count)}`}
  })
}

function ItemWell({icon, size}: {icon?: string; size: 'sm' | 'md'}) {
  const well = size === 'sm' ? 'size-7' : 'size-12'
  if (!icon) return size === 'sm' ? <span aria-hidden className={`${well} shrink-0`} /> : null
  return (
    <span aria-hidden className={`timeline-item-well grid shrink-0 place-items-center ${well}`}>
      <img alt='' className={`${size === 'sm' ? 'size-5' : 'size-10'} object-contain`} src={icon} />
    </span>
  )
}

function RewardLine({
  item,
  highlight = false,
  chancePercent,
}: {
  item: TimelineRewardItem
  highlight?: boolean
  chancePercent?: number
}) {
  const art = getRewardArt(item)
  const chance = chancePercent === undefined ? undefined : `${String(chancePercent)}%`
  return (
    <RewardPreview
      item={item}
      {...preview(art)}
      label={chance ? `${item.name} ${item.amount ?? ''}`.trim() + `, ${chance} chance` : undefined}
      className={`timeline-item flex w-full min-w-0 items-center text-left text-xs text-slate-200 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200 ${highlight ? 'min-h-14 gap-3 py-1.5' : 'min-h-10 gap-2.5 py-1 lg:min-h-9'}`}
    >
      <ItemWell icon={art?.icon} size={highlight ? 'md' : 'sm'} />
      <span className={`min-w-0 break-words ${highlight ? 'text-sm font-semibold' : ''}`}>
        {item.name}
      </span>
      <span className='ml-auto shrink-0 pl-2 font-semibold text-slate-50 tabular-nums'>
        {highlight && item.amount === '×1' ? null : item.amount}
        {chance ? <span className='ml-1.5 font-medium text-slate-300'>{chance}</span> : null}
      </span>
    </RewardPreview>
  )
}

function RewardItems({items}: {items: TimelineRewardItem[]}) {
  const highlights = items.filter((item) => getRewardArt(item)?.highlight)
  const materials = items.filter((item) => !getRewardArt(item)?.highlight)
  return (
    <div className='mt-2'>
      {highlights.length >= 3 ? (
        <ul className='grid grid-cols-4 gap-x-2 gap-y-3'>
          {withOccurrenceKeys(highlights, (item) => item.name).map(({item, key}) => {
            const art = getRewardArt(item)
            return (
              <li className='min-w-0' key={key}>
                <RewardPreview
                  item={item}
                  {...preview(art)}
                  className='timeline-item flex w-full min-w-0 flex-col items-stretch gap-1.5 text-left text-slate-200 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200'
                >
                  <span className='timeline-item-well relative grid aspect-square w-full place-items-center p-1.5'>
                    {art?.icon ? (
                      <img alt='' className='size-full object-contain' src={art.icon} />
                    ) : null}
                    {item.amount && item.amount !== '×1' ? (
                      <span className='absolute right-1 bottom-1 rounded-[2px] bg-slate-950/90 px-1 py-px text-xs leading-none font-semibold text-slate-50 tabular-nums'>
                        {item.amount}
                      </span>
                    ) : null}
                  </span>
                  <span className='line-clamp-2 text-xs leading-tight break-words'>
                    {item.name}
                  </span>
                </RewardPreview>
              </li>
            )
          })}
        </ul>
      ) : highlights.length ? (
        <div className='divide-y divide-slate-700/30'>
          {withOccurrenceKeys(highlights, (item) => item.name).map(({item, key}) => (
            <RewardLine highlight item={item} key={key} />
          ))}
        </div>
      ) : null}
      {materials.length ? (
        <div className={`${highlights.length ? 'mt-3 ' : ''}divide-y divide-slate-700/30`}>
          {withOccurrenceKeys(materials, (item) => item.name).map(({item, key}) => (
            <RewardLine item={item} key={key} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function LoginCalendar({items}: {items: TimelineRewardItem[]}) {
  if (items.every((item) => item.name === items[0].name && item.amount === items[0].amount)) {
    return (
      <>
        <RewardItems items={[items[0]]} />
        <p className='mt-2 text-xs text-slate-400'>
          Awarded on each of the first {items.length} logins.
        </p>
      </>
    )
  }
  const notable = getNotableLoginDays(items)
  return (
    <div className='timeline-login-grid mt-2'>
      {items.map((item, day) => {
        const art = getRewardArt(item)
        const bonus = notable.has(day)
        return (
          <RewardPreview
            item={item}
            {...preview(art)}
            label={`Day ${String(day + 1)}: ${item.name} ${item.amount ?? ''}${bonus ? ', bonus day' : ''}`.trim()}
            className='timeline-day flex min-h-[4.5rem] min-w-0 flex-col items-center justify-between gap-1 px-0.5 pt-1 pb-1.5 text-center focus-visible:outline-2 focus-visible:outline-amber-200'
            key={day}
            notable={bonus}
          >
            <span
              className={`text-[0.64rem] leading-none font-extrabold tracking-[0.08em] tabular-nums ${bonus ? 'text-amber-200' : 'text-slate-400'}`}
            >
              {String(day + 1).padStart(2, '0')}
            </span>
            {art?.icon ? (
              <img alt='' className='size-8 object-contain' src={art.icon} />
            ) : (
              <span className='w-full text-[0.64rem] leading-tight break-words text-slate-300'>
                {item.name}
              </span>
            )}
            <span className='text-xs leading-none font-semibold text-slate-50 tabular-nums'>
              {item.amount?.replace(/^(×?)([1-9]\d*),000$/, '$1$2K')}
            </span>
          </RewardPreview>
        )
      })}
    </div>
  )
}

function MissionRewards({
  missions,
  category,
  priceMode,
  standalone,
}: {
  missions: TimelineMissionReward[]
  category?: EventEntry['category']
  priceMode: TimelinePriceDisplayMode
  standalone: boolean
}) {
  const hasPremium = missions.some((mission) => mission.premium?.length)
  const rows = missions.map((mission) => {
    if ('label' in mission) return {mission, label: mission.label}
    const {silverPrimeExtracted} = mission
    return {
      mission,
      label: `${silverPrimeExtracted.toLocaleString('en-US')} Silver Prime extracted`,
      estimate:
        priceMode === 'usd-estimate'
          ? formatTimelinePrice(`${String(silverPrimeExtracted)} Silver Prime`, priceMode, {
              includeGifted: false,
            })
          : undefined,
    }
  })
  const isRaidDropTable = category === 'raid' && missions.every(({dropRoll}) => dropRoll)
  const tableLabel = isRaidDropTable
    ? 'Boss Avatar drops'
    : category === 'milestone'
      ? 'Rewards by milestone'
      : 'Rewards by mission'
  const table = (
    <table className='w-full table-fixed text-left'>
      <caption className='sr-only'>{tableLabel}</caption>
      {hasPremium ? (
        <thead className='border-b border-slate-700/50 text-xs text-slate-300'>
          <tr>
            <th className='w-1/2 py-2 pr-2 font-semibold' scope='col'>
              Standard
            </th>
            <th className='w-1/2 py-2 pl-2 font-semibold text-amber-200' scope='col'>
              Premium adds
            </th>
          </tr>
        </thead>
      ) : null}
      {rows.map(({mission, label, estimate}) => (
        <tbody className='border-b border-slate-700/40 last:border-b-0' key={label}>
          <tr>
            <th
              className='pt-2.5 pb-1 text-xs font-semibold text-slate-200'
              colSpan={hasPremium ? 2 : undefined}
              scope='rowgroup'
            >
              {estimate ? (
                <span className='flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1'>
                  <span>{label}</span>{' '}
                  <span className='whitespace-nowrap text-slate-300 tabular-nums'>
                    {estimate} USD
                  </span>
                </span>
              ) : (
                label
              )}
            </th>
          </tr>
          <tr className='align-top'>
            <td className={hasPremium ? 'pr-2 pb-2' : 'pb-2'}>
              {mission.standard.map((item) => (
                <RewardLine item={item} key={item.name} />
              ))}
              {mission.dropRoll ? (
                <div
                  aria-label='One random drop'
                  className='mb-1 ml-2 border-l border-slate-700/60 pl-2.5'
                  role='group'
                >
                  <p aria-hidden='true' className='pt-1 text-xs text-slate-300'>
                    One random drop
                  </p>
                  {withOccurrenceKeys(mission.dropRoll, (item) => item.name).map(({item, key}) => (
                    <RewardLine chancePercent={item.chancePercent} item={item} key={key} />
                  ))}
                </div>
              ) : null}
            </td>
            {hasPremium ? (
              <td className='pb-2 pl-2'>
                {mission.premium?.map((item) => <RewardLine item={item} key={item.name} />) ?? '—'}
              </td>
            ) : null}
          </tr>
        </tbody>
      ))}
    </table>
  )
  const label = isRaidDropTable
    ? tableLabel
    : `${category === 'milestone' ? 'By milestone' : 'By mission'} (${String(missions.length)})`
  const contents = (
    <>
      {isRaidDropTable ? (
        <p className='pb-1 text-xs leading-relaxed text-slate-400'>
          Each victory gives the listed rewards plus one random drop. The drops are the same in both
          fronts.
        </p>
      ) : null}
      {table}
    </>
  )
  if (standalone)
    return (
      <div>
        <h4 className='text-xs font-bold text-slate-200'>{label}</h4>
        {contents}
      </div>
    )
  return (
    <StageDisclosure className='border-t border-slate-700/40' label={label}>
      {contents}
    </StageDisclosure>
  )
}

export function StageRewards({
  groups,
  missions,
  priceMode,
  category,
}: {
  groups: TimelineRewardGroup[]
  missions?: TimelineMissionReward[]
  priceMode: TimelinePriceDisplayMode
  category?: EventEntry['category']
}) {
  if (!groups.length && !missions?.length) return null
  return (
    <section className='space-y-4 border-t border-slate-700/40 pt-4'>
      <h3 className='text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
        Rewards
      </h3>
      {groups.length ? (
        <div className='divide-y divide-slate-700/40'>
          {withOccurrenceKeys(groups, (group) => group.title ?? 'rewards').map(
            ({item: group, key}) => {
              const kind = getGroupKind(group.title)
              const KindIcon =
                kind === 'stock' ? FaShop : kind === 'repeatable' ? FaArrowsRotate : undefined
              return (
                <div className='py-4 first:pt-0' key={key}>
                  {group.title ? (
                    <h4 className='flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs font-bold text-slate-200'>
                      <span className='inline-flex items-baseline gap-1.5'>
                        {KindIcon ? (
                          <KindIcon
                            aria-hidden
                            className='size-3 shrink-0 self-center text-slate-400'
                          />
                        ) : null}
                        {group.title}
                      </span>
                      {group.price ? (
                        <span
                          className={
                            group.price === 'Free'
                              ? 'font-medium text-slate-300'
                              : 'font-semibold text-amber-200'
                          }
                        >
                          {formatTimelinePrice(group.price, priceMode)}
                        </span>
                      ) : null}
                    </h4>
                  ) : null}
                  {group.note ? (
                    <p className='mt-1 text-xs leading-relaxed text-slate-400'>{group.note}</p>
                  ) : null}
                  {group.layout === 'days' ? (
                    <LoginCalendar items={group.items} />
                  ) : (
                    <RewardItems items={group.items.slice(0, group.summaryCount)} />
                  )}
                  {group.summaryCount && group.summaryCount < group.items.length ? (
                    <StageDisclosure
                      className='mt-2 border-t border-slate-700/40'
                      label={getMoreLabel(group, group.items.length - group.summaryCount)}
                    >
                      <RewardItems items={group.items.slice(group.summaryCount)} />
                    </StageDisclosure>
                  ) : null}
                  {group.claims?.length ? <ClaimSchedule claims={group.claims} /> : null}
                </div>
              )
            },
          )}
        </div>
      ) : null}
      {missions?.length ? (
        <MissionRewards
          category={category}
          missions={missions}
          priceMode={priceMode}
          standalone={!groups.length}
        />
      ) : null}
    </section>
  )
}
