import {useMemo} from 'react'

import {CompactArtTile} from '@/components/ui/CompactArtTile'
import {
  getAwakenerBuildEntryById,
  type AwakenerBuild,
  type AwakenerBuildWheelTier,
} from '@/domain/awakener-builds'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants} from '@/domain/covenants'
import {getMainstatByKey, getMainstatIcon, type MainstatKey} from '@/domain/mainstats'
import {useAwakenerBuildEntries} from '@/domain/useAwakenerBuildEntries'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheelById} from '@/domain/wheels'

import {
  DatabaseTab,
  DatabaseTabRow,
  DatabaseTabSection,
  DatabaseTabSubsection,
} from './DatabaseTabSection'
import {scaledFontStyle} from './font-scale'

interface AwakenerBuildsTabProps {
  awakenerId: number
}

const PRIMARY_WHEEL_TIERS: AwakenerBuildWheelTier[] = ['BIS_SSR', 'ALT_SSR', 'BIS_SR']

const TIER_LABELS: Record<AwakenerBuildWheelTier, string> = {
  BIS_SSR: 'BiS SSR',
  ALT_SSR: 'Alt SSR',
  BIS_SR: 'BiS SR',
  GOOD: 'Good',
}

const RECOMMENDATION_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fill,minmax(6rem,6rem))] items-start gap-2 justify-start'

function getWheelGroupByTier(build: AwakenerBuild, tier: AwakenerBuildWheelTier) {
  return build.recommendedWheels.find((group) => group.tier === tier)
}

const covenantNameById = new Map(getCovenants().map((covenant) => [covenant.id, covenant.name]))

function RecommendationTile({
  asset,
  altText,
  label,
  chip,
  imageClassName = '',
  tileClassName = 'builder-picker-tile w-24 border border-slate-500/45 bg-slate-900/55 p-1',
  aspectClassName = 'aspect-[75/113]',
}: {
  asset?: string
  altText: string
  label: string
  chip: string
  imageClassName?: string
  tileClassName?: string
  aspectClassName?: string
}) {
  return (
    <CompactArtTile
      chips={<span className='builder-picker-recommendation-chip text-amber-100/95'>{chip}</span>}
      containerClassName={tileClassName}
      name={label}
      nameClassName='compact-art-tile-name-multiline mt-1.5 text-slate-200'
      preview={
        asset ? (
          <img
            alt={altText}
            className={`h-full w-full object-cover ${imageClassName}`.trim()}
            draggable={false}
            src={asset}
          />
        ) : (
          <div className='h-full w-full bg-[radial-gradient(circle_at_50%_30%,rgba(148,163,184,0.18),rgba(2,8,23,0.94)_72%)]' />
        )
      }
      previewClassName={`${aspectClassName} border border-slate-600/35 bg-slate-900/75`}
    />
  )
}

function SubstatPriorityInline({build}: {build: AwakenerBuild}) {
  return (
    <div className='mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-200'>
      {build.substatPriorityGroups.map((group, groupIndex) => (
        <div className='contents' key={`${build.id}-${String(groupIndex)}`}>
          {group.map((key, statIndex) => (
            <div className='contents' key={key}>
              {statIndex > 0 ? <span className='text-slate-500'>=</span> : null}
              <SubstatIconChip mainstatKey={key} />
            </div>
          ))}
          {groupIndex < build.substatPriorityGroups.length - 1 ? (
            <span className='text-slate-500'>{'>'}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SubstatIconChip({mainstatKey}: {mainstatKey: MainstatKey}) {
  const icon = getMainstatIcon(mainstatKey)
  const label = getMainstatByKey(mainstatKey)?.label ?? mainstatKey

  return (
    <span
      className='inline-flex h-6 w-6 items-center justify-center border border-slate-600/45 bg-slate-950/55'
      title={label}
    >
      {icon ? (
        <img
          alt={label}
          className='h-4 w-4 object-contain opacity-90'
          draggable={false}
          src={icon}
        />
      ) : (
        <span className='text-[9px] tracking-wide text-slate-300 uppercase'>
          {label.slice(0, 2)}
        </span>
      )}
    </span>
  )
}

function RecommendationLine({
  build,
  tiers,
}: {
  build: AwakenerBuild
  tiers: AwakenerBuildWheelTier[]
}) {
  const groups = tiers
    .map((tier) => getWheelGroupByTier(build, tier))
    .filter((group): group is NonNullable<typeof group> => Boolean(group))

  if (groups.length === 0) {
    return null
  }

  return (
    <div className={RECOMMENDATION_GRID_CLASS}>
      {groups.flatMap((group) =>
        group.wheelIds.map((wheelId) => {
          const wheel = getWheelById(wheelId)
          return (
            <RecommendationTile
              altText={`${wheel?.name ?? wheelId} wheel`}
              asset={getWheelAssetById(wheelId)}
              chip={TIER_LABELS[group.tier]}
              imageClassName='builder-picker-wheel-image'
              key={`${group.tier}-${wheelId}`}
              label={wheel?.name ?? wheelId}
            />
          )
        }),
      )}
    </div>
  )
}

function CovenantRecommendationGrid({build}: {build: AwakenerBuild}) {
  return (
    <div className={RECOMMENDATION_GRID_CLASS}>
      {build.recommendedCovenantIds.map((covenantId, index) => {
        const label = covenantNameById.get(covenantId) ?? covenantId
        return (
          <RecommendationTile
            altText={`${label} covenant`}
            aspectClassName='aspect-square'
            asset={getCovenantAssetById(covenantId)}
            chip={`#${String(index + 1)}`}
            key={covenantId}
            label={label}
          />
        )
      })}
    </div>
  )
}

function WheelRecommendations({build}: {build: AwakenerBuild}) {
  const hasGoodOptions = Boolean(getWheelGroupByTier(build, 'GOOD'))

  return (
    <div className='space-y-2.5'>
      <div>
        <p className='text-slate-300/75' style={scaledFontStyle(11)}>
          Top Picks
        </p>
        <div className='mt-1.5'>
          <RecommendationLine build={build} tiers={PRIMARY_WHEEL_TIERS} />
        </div>
      </div>
      {hasGoodOptions ? (
        <>
          <div className='h-px bg-gradient-to-r from-slate-600/40 via-slate-600/15 to-transparent' />
          <div>
            <p className='text-slate-300/75' style={scaledFontStyle(11)}>
              Good Options
            </p>
            <div className='mt-1.5'>
              <RecommendationLine build={build} tiers={['GOOD']} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function BuildCard({
  build,
  showLabel,
  collapsible = false,
}: {
  build: AwakenerBuild
  showLabel: boolean
  collapsible?: boolean
}) {
  const hasSummary = Boolean(build.summary)
  const hasNote = Boolean(build.note)
  const sectionTitle = showLabel ? build.label : undefined

  return (
    <DatabaseTabSection collapsible={collapsible && Boolean(sectionTitle)} title={sectionTitle}>
      <DatabaseTabSubsection>
        {hasSummary ? (
          <div className='px-4 py-2.5'>
            <p className='leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
              {build.summary}
            </p>
          </div>
        ) : null}

        <DatabaseTabRow label='Substat Priority'>
          <SubstatPriorityInline build={build} />
        </DatabaseTabRow>

        <DatabaseTabRow label='Recommended Wheels'>
          <WheelRecommendations build={build} />
        </DatabaseTabRow>

        <DatabaseTabRow label='Recommended Covenants'>
          <CovenantRecommendationGrid build={build} />
        </DatabaseTabRow>

        {hasNote ? (
          <DatabaseTabRow label='Notes'>
            <p className='max-w-2xl leading-relaxed text-slate-300/85' style={scaledFontStyle(12)}>
              {build.note}
            </p>
          </DatabaseTabRow>
        ) : null}
      </DatabaseTabSubsection>
    </DatabaseTabSection>
  )
}

export function AwakenerBuildsTab({awakenerId}: AwakenerBuildsTabProps) {
  const entries = useAwakenerBuildEntries()

  const entry = useMemo(() => {
    return entries ? getAwakenerBuildEntryById(awakenerId, entries) : undefined
  }, [awakenerId, entries])

  if (!entries) {
    return <p className='py-4 text-xs text-slate-400'>Loading...</p>
  }

  if (!entry) {
    return <p className='py-4 text-xs text-slate-400'>No curated builds available yet.</p>
  }

  const showBuildLabels = entry.builds.length > 1

  return (
    <DatabaseTab>
      {entry.builds.map((build) => (
        <BuildCard
          build={build}
          collapsible={showBuildLabels}
          key={build.id}
          showLabel={showBuildLabels}
        />
      ))}
    </DatabaseTab>
  )
}
