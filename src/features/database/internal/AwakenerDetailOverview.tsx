import {useMemo, useState} from 'react'

import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullRecord, AwakenerProfileStorySection} from '@/domain/awakeners-full'
import type {ScalingInfoRecord} from '@/domain/database-scaling-info'

import {AwakenerDetailProfileFacts} from './AwakenerDetailProfileFacts'
import {AwakenerDetailStatsPanel} from './AwakenerDetailStatsPanel'
import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_FIXED_UTILITY_ACTION_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import type {FontScale} from './font-scale'
import {WheelLoreText} from './WheelLoreText'

interface AwakenerDetailOverviewProps {
  awakener: Awakener
  areStatsExpanded?: boolean
  fullData: AwakenerFullRecord
  fontScale: FontScale
  onStatsExpandedChange?: (isExpanded: boolean) => void
  stats: FullStats | null
  substatScaling: SubstatScaling | null
  scalingRecord: ScalingInfoRecord
}

function getStoryNavLabel(section: AwakenerProfileStorySection, index: number): string {
  if (section.kind === 'introduction' || index === 0) {
    return 'Intro'
  }

  const romanMatch = /(?:Story:?\s*)?([IVX]+)$/i.exec(section.title.trim())
  return romanMatch?.[1] ?? String(index)
}

function getStoryHeading(section: AwakenerProfileStorySection, index: number): string {
  if (section.kind === 'introduction' || index === 0) {
    return 'Introduction'
  }
  return section.title.replace(':', '').trim()
}

function getStoryPreview(content: string): string {
  const preview = content
    .replace(/@[1-4]/g, '')
    .replace(/<([A-Za-z]+):([^>]+)>/g, '$2')
    .replace(/<([A-Za-z]+)>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  return preview.length > 104 ? `${preview.slice(0, 104).trim()}...` : preview
}

function shouldShowStoryUnlock(section: AwakenerProfileStorySection, index: number): boolean {
  return index > 0 && section.kind !== 'introduction' && Boolean(section.unlockCondition)
}

export function AwakenerDetailOverview({
  areStatsExpanded,
  awakener,
  fullData,
  onStatsExpandedChange,
  scalingRecord,
  stats,
  substatScaling,
}: AwakenerDetailOverviewProps) {
  const profile = fullData.profile
  const stories = useMemo(() => profile?.storySections ?? [], [profile?.storySections])
  const [storySelection, setStorySelection] = useState({awakenerId: awakener.id, index: 0})
  const activeStoryIndex = storySelection.awakenerId === awakener.id ? storySelection.index : 0
  const activeStory = stories.at(activeStoryIndex) ?? null

  if (!profile && stories.length === 0) {
    return (
      <div className='space-y-3'>
        <AwakenerDetailStatsPanel
          compact
          isExpanded={areStatsExpanded}
          onExpandedChange={onStatsExpandedChange}
          scalingRecord={scalingRecord}
          stats={stats}
          substatScaling={substatScaling}
        />
        <p className='text-xs text-slate-400'>No profile or story data available yet.</p>
      </div>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-4 md:flex-row md:gap-5'>
      <div className='mt-5 space-y-3 md:hidden'>
        <AwakenerDetailProfileFacts compact profile={profile} />
        <AwakenerDetailStatsPanel
          compact
          isExpanded={areStatsExpanded}
          onExpandedChange={onStatsExpandedChange}
          scalingRecord={scalingRecord}
          stats={stats}
          substatScaling={substatScaling}
        />
      </div>

      {activeStory ? (
        <>
          <section className='flex min-h-0 min-w-0 flex-1 flex-col'>
            <div className='sticky top-0 z-[2] -mx-5 border-y border-slate-800/80 bg-slate-950/[.97] px-5 py-2 md:hidden'>
              <div
                aria-label='Awakener stories'
                className='database-scrollbar flex gap-1.5 overflow-x-auto'
                role='tablist'
              >
                {stories.map((story, index) => {
                  const label = getStoryNavLabel(story, index)
                  const isActive = index === activeStoryIndex

                  return (
                    <button
                      aria-selected={isActive}
                      className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center border-b-2 px-3 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors ${
                        isActive
                          ? 'border-amber-200/80 text-amber-100'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                      key={`${story.title}:${index.toString()}`}
                      onClick={() => {
                        setStorySelection({awakenerId: awakener.id, index})
                      }}
                      role='tab'
                      type='button'
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <article className='database-scrollbar min-h-0 flex-1 pt-3 md:overflow-y-auto md:border md:border-slate-800/80 md:bg-slate-950/45 md:px-4 md:py-3'>
              <div className='max-w-[68ch] pb-8 md:pb-2'>
                <div className='flex items-baseline justify-between gap-3'>
                  <h4
                    className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
                    style={getDatabaseDetailSectionHeadingStyle()}
                  >
                    {getStoryHeading(activeStory, activeStoryIndex)}
                  </h4>
                  {shouldShowStoryUnlock(activeStory, activeStoryIndex) ? (
                    <p className='shrink-0 text-[10px] tracking-[0.16em] text-amber-100/70 uppercase'>
                      {activeStory.unlockCondition}
                    </p>
                  ) : null}
                </div>
                <WheelLoreText defaultExpanded lore={activeStory.content} previewLineCount={999} />
              </div>
            </article>
          </section>

          <aside className='hidden w-72 shrink-0 flex-col border-l border-slate-800/80 pl-4 md:flex md:min-h-0'>
            <h4
              className='ui-title mb-2 shrink-0 text-slate-400 uppercase'
              style={getDatabaseDetailSectionHeadingStyle()}
            >
              Story Index
            </h4>
            <div className='database-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1'>
              {stories.map((story, index) => {
                const isActive = index === activeStoryIndex
                const label = getStoryNavLabel(story, index)

                return (
                  <button
                    className={`w-full border px-2.5 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-amber-200/75 bg-amber-200/8'
                        : 'border-slate-700/55 bg-slate-950/30 hover:border-slate-500/65'
                    }`}
                    key={`${story.title}:${index.toString()}`}
                    onClick={() => {
                      setStorySelection({awakenerId: awakener.id, index})
                    }}
                    type='button'
                  >
                    <span className='flex items-center justify-between gap-3'>
                      <span className='ui-title text-[12px] text-amber-100'>{label}</span>
                      {shouldShowStoryUnlock(story, index) ? (
                        <span className='truncate text-[9px] tracking-[0.12em] text-slate-500 uppercase'>
                          Unlock: {story.unlockCondition}
                        </span>
                      ) : null}
                    </span>
                    <span className='mt-1 [display:-webkit-box] block overflow-hidden text-[11px] leading-snug text-slate-500 [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'>
                      {getStoryPreview(story.content)}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>
        </>
      ) : (
        <section className='border border-slate-700/45 bg-slate-900/20 px-4 py-3'>
          <h4
            className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
            style={getDatabaseDetailSectionHeadingStyle()}
          >
            Profile
          </h4>
          <p className={`mt-2 ${DATABASE_DETAIL_BODY_CLASS}`} style={getDatabaseDetailBodyStyle()}>
            Profile facts are available, but no story sections are linked yet.
          </p>
          <p className={`mt-3 ${DATABASE_DETAIL_FIXED_UTILITY_ACTION_CLASS} text-slate-500`}>
            Story data missing
          </p>
        </section>
      )}
    </div>
  )
}
