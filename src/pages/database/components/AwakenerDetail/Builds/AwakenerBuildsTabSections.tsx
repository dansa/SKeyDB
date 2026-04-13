import {useState} from 'react'

import {CompactArtTile} from '@/components/ui/CompactArtTile'
import {type AwakenerBuild, type AwakenerBuildWheelTier} from '@/domain/awakener-builds'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants} from '@/domain/covenants'
import {getMainstatByKey, getMainstatIcon, type MainstatKey} from '@/domain/mainstats'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheelById} from '@/domain/wheels'

import {scaledFontStyle} from '../../../utils/font-scale'
import {DATABASE_SECTION_TITLE_CLASS} from '../../../utils/text-styles'

const PRIMARY_WHEEL_TIERS: AwakenerBuildWheelTier[] = ['BIS_SSR', 'ALT_SSR', 'BIS_SR']

const TIER_LABELS: Record<AwakenerBuildWheelTier, string> = {
  BIS_SSR: 'BiS SSR',
  ALT_SSR: 'Alt SSR',
  BIS_SR: 'BiS SR',
  GOOD: 'Good',
}

const RECOMMENDATION_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fill,minmax(6rem,6rem))] items-start gap-2 justify-start'

const covenantNameById = new Map(getCovenants().map((covenant) => [covenant.id, covenant.name]))

function getWheelGroupByTier(build: AwakenerBuild, tier: AwakenerBuildWheelTier) {
  return build.recommendedWheels.find((group) => group.tier === tier)
}

function RecommendationTile({
  asset,
  altText,
  label,
  chip,
  imageClassName = '',
  aspectClassName = 'aspect-[75/113]',
  isCovenant = false,
}: {
  asset?: string
  altText: string
  label: string
  chip: string
  imageClassName?: string
  aspectClassName?: string
  isCovenant?: boolean
}) {
  return (
    <div style={scaledFontStyle(16)}>
      <CompactArtTile
        chips={<span className='builder-picker-recommendation-chip text-amber-100/95'>{chip}</span>}
        containerClassName='w-[6em] border border-white/[0.06] bg-white/[0.02] p-[0.375em] shadow-sm'
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
        previewClassName={`${aspectClassName} ${isCovenant ? '' : 'border border-white/[0.06] bg-white/[0.02]'}`}
      />
    </div>
  )
}

function SubstatIconChip({mainstatKey}: {mainstatKey: MainstatKey}) {
  const icon = getMainstatIcon(mainstatKey)
  const label = getMainstatByKey(mainstatKey)?.label ?? mainstatKey

  return (
    <span
      className='inline-flex items-center justify-center gap-1.5 border border-white/6 bg-white/2 px-2 shadow-sm'
      style={{...scaledFontStyle(14), height: '1.7em'}}
      title={label}
    >
      {icon ? (
        <img
          alt={label}
          className='shrink-0 object-contain opacity-90'
          draggable={false}
          src={icon}
          style={{width: '1em', height: '1em'}}
        />
      ) : (
        <span
          className='shrink-0 font-medium tracking-wide text-slate-300 uppercase'
          style={{fontSize: '0.7em'}}
        >
          {label.slice(0, 2)}
        </span>
      )}
      <span className='whitespace-nowrap text-slate-300/90' style={{fontSize: '0.8em'}}>
        {label}
      </span>
    </span>
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
            isCovenant
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
    <div className='space-y-3'>
      <div>
        <p className='text-slate-300/75' style={scaledFontStyle(11)}>
          Top Picks
        </p>
        <div className='mt-1.5'>
          <RecommendationLine build={build} tiers={PRIMARY_WHEEL_TIERS} />
        </div>
      </div>
      {hasGoodOptions ? (
        <div>
          <p className='text-slate-300/75' style={scaledFontStyle(11)}>
            Good Options
          </p>
          <div className='mt-1.5'>
            <RecommendationLine build={build} tiers={['GOOD']} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BuildSection({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(20)}>
        {title}
      </h4>
      <div className='mx-4 mt-0.5 mb-1.5 h-px bg-linear-to-r from-white/8 via-white/3 to-transparent' />
      <div className='flex flex-col gap-y-3 px-4 pt-1 pb-2'>
        <div className='border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'>{children}</div>
      </div>
    </div>
  )
}

function BuildTilesSection({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(20)}>
        {title}
      </h4>
      <div className='mx-4 mt-0.5 mb-1.5 h-px bg-linear-to-r from-white/8 via-white/3 to-transparent' />
      <div className='flex flex-col gap-y-3 px-4 pt-1 pb-2'>{children}</div>
    </div>
  )
}

export function AwakenerBuildCard({
  build,
  showLabel,
  collapsible = false,
  defaultCollapsed = false,
}: {
  build: AwakenerBuild
  showLabel: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const hasSummary = Boolean(build.summary)
  const hasNote = Boolean(build.note)
  const sectionTitle = showLabel ? build.label : undefined

  const content = (
    <div className='space-y-4'>
      {hasSummary ? (
        <div className='px-1 py-1'>
          <p className='leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
            {build.summary}
          </p>
        </div>
      ) : null}

      <BuildTilesSection title='Substat Priority'>
        <SubstatPriorityInline build={build} />
      </BuildTilesSection>

      <BuildTilesSection title='Recommended Wheels'>
        <WheelRecommendations build={build} />
      </BuildTilesSection>

      <BuildTilesSection title='Recommended Covenants'>
        <CovenantRecommendationGrid build={build} />
      </BuildTilesSection>

      {hasNote ? (
        <BuildSection title='Notes'>
          <p className='max-w-2xl leading-relaxed text-slate-300/85' style={scaledFontStyle(12)}>
            {build.note}
          </p>
        </BuildSection>
      ) : null}
    </div>
  )

  if (!showLabel) {
    return content
  }

  return (
    <div className='mb-6 space-y-4'>
      {sectionTitle ? (
        collapsible ? (
          <button
            className='flex w-full items-center gap-1.5 text-left transition-opacity hover:opacity-80'
            onClick={() => {
              setCollapsed((current) => !current)
            }}
            type='button'
          >
            <h3
              className={`text-amber-100/90 ${DATABASE_SECTION_TITLE_CLASS} whitespace-nowrap`}
              style={scaledFontStyle(24)}
            >
              {sectionTitle}
            </h3>
            <div className='h-0.5 flex-1 bg-white/6' />
            <span className='whitespace-nowrap text-amber-100/50' style={scaledFontStyle(10)}>
              {collapsed ? 'SHOW' : 'HIDE'}
            </span>
          </button>
        ) : (
          <div className='flex items-center gap-1.5'>
            <h3
              className={`text-amber-100/90 ${DATABASE_SECTION_TITLE_CLASS} whitespace-nowrap`}
              style={scaledFontStyle(24)}
            >
              {sectionTitle}
            </h3>
            <div className='h-0.5 flex-1 bg-white/6' />
          </div>
        )
      ) : null}

      {!collapsed ? (
        <div className='ml-4 space-y-4 border-b-2 border-l-2 border-white/6 pt-1 pb-4 pl-4'>
          {content}
        </div>
      ) : null}
    </div>
  )
}
