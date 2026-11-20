import type {ElementType, ReactNode} from 'react'

import {TimelineArchiveSection} from './TimelineArchiveSection'

type TimelineSectionKind = 'active' | 'upcoming' | 'ended'

interface TimelineArchiveConfig {
  expanded: boolean
  onToggle: () => void
  sectionId: string
  title: string
}

interface TimelineStatusSectionsProps<TEntry> {
  activeContainer?: ElementType
  archiveContainer?: 'div' | 'ul'
  activeItems: TEntry[]
  ended: TimelineArchiveConfig
  endedItems: TEntry[]
  gridClassName: string
  renderItem: (entry: TEntry, section: TimelineSectionKind) => ReactNode
  upcoming: TimelineArchiveConfig
  upcomingItems: TEntry[]
  wrapperClassName?: string
}

export function TimelineStatusSections<TEntry>({
  activeContainer: ActiveContainer = 'div',
  archiveContainer,
  activeItems,
  ended,
  endedItems,
  gridClassName,
  renderItem,
  upcoming,
  upcomingItems,
  wrapperClassName = 'space-y-6',
}: TimelineStatusSectionsProps<TEntry>) {
  return (
    <div className={wrapperClassName}>
      {activeItems.length > 0 ? (
        <ActiveContainer className={gridClassName}>
          {activeItems.map((entry) => renderItem(entry, 'active'))}
        </ActiveContainer>
      ) : null}

      {upcomingItems.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={gridClassName}
          contentContainer={archiveContainer}
          expanded={upcoming.expanded}
          itemCount={upcomingItems.length}
          onToggle={upcoming.onToggle}
          sectionId={upcoming.sectionId}
          title={upcoming.title}
        >
          {upcomingItems.map((entry) => renderItem(entry, 'upcoming'))}
        </TimelineArchiveSection>
      ) : null}

      {endedItems.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={gridClassName}
          contentContainer={archiveContainer}
          expanded={ended.expanded}
          itemCount={endedItems.length}
          onToggle={ended.onToggle}
          sectionId={ended.sectionId}
          title={ended.title}
        >
          {endedItems.map((entry) => renderItem(entry, 'ended'))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}
