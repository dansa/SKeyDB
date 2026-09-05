import {useId, useState, type KeyboardEvent} from 'react'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullRecord, AwakenerQuoteCategory} from '@/domain/awakeners-full'
import {
  DetailIndexedReader,
  type DetailIndexEntry,
} from '@/features/database/detail/DetailIndexedReader'

import {AwakenerDetailProfileFacts} from './AwakenerDetailProfileFacts'
import {AwakenerQuoteText} from './AwakenerQuoteText'
import {
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import {DATABASE_ITEM_NAME_CLASS} from './text-styles'
import {WheelLoreText} from './WheelLoreText'

const LORE_SECTIONS = [
  {id: 'intro', label: 'Intro'},
  {id: 'stories', label: 'Stories'},
  {id: 'quotes', label: 'Quotes'},
  {id: 'skills', label: 'Skills'},
] as const
type LoreSection = (typeof LORE_SECTIONS)[number]['id']

const QUOTE_CATEGORIES: {id: AwakenerQuoteCategory; label: string}[] = [
  {id: 'daily', label: 'Daily'},
  {id: 'battle', label: 'Battle'},
  {id: 'traphase', label: 'Traphase'},
]

const LORE_HEADING_CLASS = 'ui-title mb-4 text-amber-200/90'
const ANCHOR_CLASS = 'scroll-mt-4 outline-offset-4 focus-visible:outline-amber-200'

export function AwakenerDetailLore({
  awakener,
  fullData,
}: {
  awakener: Awakener
  fullData: AwakenerFullRecord
}) {
  return (
    <AwakenerLoreReader releaseDate={awakener.releaseDate} fullData={fullData} key={awakener.id} />
  )
}

function AwakenerLoreReader({
  fullData,
  releaseDate,
}: {
  fullData: AwakenerFullRecord
  releaseDate?: string
}) {
  const [section, setSection] = useState<LoreSection>('intro')
  const [storyId, setStoryId] = useState('lore-story-0')
  const [storyNavigation, setStoryNavigation] = useState(0)
  const tabsetId = useId()
  const stories = (fullData.profile?.storySections ?? [])
    .filter((story) => story.kind === 'story')
    .map((story, index) => ({...story, id: `lore-story-${String(index)}`}))
  const introduction = fullData.profile?.storySections?.find(
    (story) => story.kind === 'introduction',
  )
  const selectedStory = stories.find((story) => story.id === storyId) ?? stories.at(0)
  const storyIndex = stories.findIndex((story) => story.id === selectedStory?.id)
  const adjacentStories = [
    {story: storyIndex > 0 ? stories.at(storyIndex - 1) : undefined, direction: 'Previous'},
    {story: stories.at(storyIndex + 1), direction: 'Next'},
  ] as const
  const quoteGroups = QUOTE_CATEGORIES.map((category) => ({
    ...category,
    quotes: fullData.profile?.voiceLines?.[category.id] ?? [],
  })).filter((group) => group.quotes.length > 0)
  const skillLore = [
    fullData.cards.C2,
    fullData.cards.C3,
    fullData.cards.C1,
    fullData.cards.C4,
    fullData.cards.C5,
    fullData.cards.Exalt,
  ].filter((skill) => skill.lore?.trim())

  const indexes: Record<LoreSection, DetailIndexEntry[]> = {
    intro: [],
    stories: stories.map((story) => ({id: story.id, label: story.title.replace(':', '')})),
    quotes: quoteGroups.map((group) => ({
      id: `lore-quotes-${group.id}`,
      label: group.label,
      children: group.quotes.map((quote) => ({
        id: `lore-quote-${quote.id}`,
        label: quote.title.replace(/^Chat:\s*/, ''),
      })),
    })),
    skills: skillLore.map((skill) => ({id: `lore-skill-${skill.id}`, label: skill.displayName})),
  }

  function navigateSection(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % LORE_SECTIONS.length
        : event.key === 'ArrowLeft'
          ? (index + LORE_SECTIONS.length - 1) % LORE_SECTIONS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? LORE_SECTIONS.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    const nextSection = LORE_SECTIONS[next]
    setSection(nextSection.id)
    document.getElementById(`${tabsetId}-${nextSection.id}`)?.focus()
  }

  return (
    <DetailIndexedReader
      resetScrollKey={storyNavigation}
      items={indexes[section]}
      onSelect={section === 'stories' ? setStoryId : undefined}
      scrollKey={section === 'stories' ? `stories:${selectedStory?.id ?? ''}` : section}
      selectedId={section === 'stories' ? selectedStory?.id : undefined}
      toolbar={
        <div
          aria-label='Lore sections'
          className='flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 px-4 md:px-5'
          role='tablist'
        >
          {LORE_SECTIONS.map((entry, index) => (
            <button
              aria-controls={`${tabsetId}-panel`}
              aria-selected={section === entry.id}
              className={`min-h-11 shrink-0 border-b px-3 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-amber-200 ${section === entry.id ? 'border-amber-200/70 text-amber-100' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              id={`${tabsetId}-${entry.id}`}
              key={entry.id}
              onClick={() => {
                setSection(entry.id)
              }}
              onKeyDown={(event) => {
                navigateSection(event, index)
              }}
              role='tab'
              tabIndex={section === entry.id ? 0 : -1}
              type='button'
            >
              {entry.label}
            </button>
          ))}
        </div>
      }
    >
      <div
        aria-labelledby={`${tabsetId}-${section}`}
        className='mx-auto w-full max-w-[68ch] pb-8'
        id={`${tabsetId}-panel`}
        role='tabpanel'
        tabIndex={0}
      >
        {section === 'intro' ? (
          <article>
            <div className='mb-6 md:hidden'>
              <AwakenerDetailProfileFacts
                scaleWithContent
                releaseDate={releaseDate}
                profile={fullData.profile}
              />
            </div>
            <h4 className={LORE_HEADING_CLASS} style={getDatabaseDetailSectionHeadingStyle()}>
              Introduction
            </h4>
            {introduction ? (
              <WheelLoreText defaultExpanded lore={introduction.content} previewLineCount={999} />
            ) : (
              <LoreEmptyState>No introduction is available yet.</LoreEmptyState>
            )}
          </article>
        ) : null}
        {section === 'stories' ? (
          selectedStory ? (
            <article
              className={ANCHOR_CLASS}
              data-detail-anchor
              id={selectedStory.id}
              tabIndex={-1}
            >
              <h4 className={LORE_HEADING_CLASS} style={getDatabaseDetailSectionHeadingStyle()}>
                {selectedStory.title.replace(':', '')}
              </h4>
              {selectedStory.unlockCondition ? (
                <p className='mb-4 text-slate-400' style={getDatabaseDetailBodyStyle()}>
                  {selectedStory.unlockCondition}
                </p>
              ) : null}
              <WheelLoreText defaultExpanded lore={selectedStory.content} previewLineCount={999} />
              {stories.length > 1 ? (
                <nav
                  aria-label='Story navigation'
                  className='mt-6 flex justify-between gap-4 border-t border-slate-800 pt-2'
                >
                  {adjacentStories.map(({story, direction}) =>
                    story ? (
                      <button
                        key={direction}
                        type='button'
                        aria-label={`${direction}: ${story.title.replace(':', '')}`}
                        className={`min-h-11 py-2 text-xs text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200 ${direction === 'Next' ? 'ml-auto text-right' : 'text-left'}`}
                        onClick={() => {
                          setStoryId(story.id)
                          setStoryNavigation((value) => value + 1)
                        }}
                      >
                        {direction === 'Previous' ? '← ' : ''}
                        {story.title.replace(':', '')}
                        {direction === 'Next' ? ' →' : ''}
                      </button>
                    ) : null,
                  )}
                </nav>
              ) : null}
            </article>
          ) : (
            <LoreEmptyState>No stories are available yet.</LoreEmptyState>
          )
        ) : null}
        {section === 'quotes' ? (
          quoteGroups.length ? (
            <div className='space-y-10'>
              {quoteGroups.map((group) => (
                <section key={group.id}>
                  <h4
                    className={`${LORE_HEADING_CLASS} ${ANCHOR_CLASS}`}
                    style={getDatabaseDetailSectionHeadingStyle()}
                    data-detail-anchor
                    id={`lore-quotes-${group.id}`}
                    tabIndex={-1}
                  >
                    {group.label}
                  </h4>
                  <div className='divide-y divide-slate-800'>
                    {group.quotes.map((quote) => (
                      <article
                        className={`py-5 first:pt-0 ${ANCHOR_CLASS}`}
                        data-detail-anchor
                        id={`lore-quote-${quote.id}`}
                        key={quote.id}
                        tabIndex={-1}
                      >
                        <h5
                          className={`mb-2 ${DATABASE_ITEM_NAME_CLASS}`}
                          style={getDatabaseDetailBodyStyle()}
                        >
                          {quote.title}
                        </h5>
                        <AwakenerQuoteText fullData={fullData} quote={quote} />
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <LoreEmptyState>No quotes are available yet.</LoreEmptyState>
          )
        ) : null}
        {section === 'skills' ? (
          skillLore.length ? (
            <div className='divide-y divide-slate-800'>
              {skillLore.map((skill) => (
                <article
                  className={`py-5 first:pt-0 ${ANCHOR_CLASS}`}
                  data-detail-anchor
                  id={`lore-skill-${skill.id}`}
                  key={skill.id}
                  tabIndex={-1}
                >
                  <h4
                    className={`mb-2 ${DATABASE_ITEM_NAME_CLASS}`}
                    style={getDatabaseDetailBodyStyle()}
                  >
                    {skill.displayName}
                  </h4>
                  <WheelLoreText defaultExpanded lore={skill.lore ?? ''} previewLineCount={999} />
                </article>
              ))}
            </div>
          ) : (
            <LoreEmptyState>No skill lore is available yet.</LoreEmptyState>
          )
        ) : null}
      </div>
    </DetailIndexedReader>
  )
}

function LoreEmptyState({children}: {children: string}) {
  return (
    <p className='text-slate-400' style={getDatabaseDetailBodyStyle()}>
      {children}
    </p>
  )
}
