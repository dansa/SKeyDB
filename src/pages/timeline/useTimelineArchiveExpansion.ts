import {useState} from 'react'

import type {TimelineSectionId} from '@/domain/timeline-routing'

type ArchiveExpansionRole = 'ended' | 'upcoming'
type ArchiveExpansionKey = TimelineSectionId | 'none'
type ArchiveExpansionOverrides = Partial<
  Record<ArchiveExpansionKey, Partial<Record<ArchiveExpansionRole, boolean>>>
>

interface UseTimelineArchiveExpansionOptions {
  endedSectionId: TimelineSectionId
  /** Opens the archive holding a selected entry once per entry, leaving later toggles to the reader. */
  reveal?: {role: ArchiveExpansionRole; key: string}
  targetSection?: TimelineSectionId
  upcomingSectionId: TimelineSectionId
}

export function useTimelineArchiveExpansion({
  endedSectionId,
  reveal,
  targetSection,
  upcomingSectionId,
}: UseTimelineArchiveExpansionOptions) {
  const [overrides, setOverrides] = useState<ArchiveExpansionOverrides>({})
  const [revealedKey, setRevealedKey] = useState<string>()
  const targetKey: ArchiveExpansionKey = targetSection ?? 'none'
  if (reveal && reveal.key !== revealedKey) {
    setRevealedKey(reveal.key)
    setOverrides((current) => ({
      ...current,
      [targetKey]: {...current[targetKey], [reveal.role]: true},
    }))
  }

  function getDefaultExpanded(role: ArchiveExpansionRole): boolean {
    if (role === 'upcoming') {
      return targetSection ? targetSection === upcomingSectionId : true
    }
    return targetSection === endedSectionId
  }

  function getExpanded(role: ArchiveExpansionRole): boolean {
    return overrides[targetKey]?.[role] ?? getDefaultExpanded(role)
  }

  function toggle(role: ArchiveExpansionRole) {
    const nextExpanded = !getExpanded(role)
    setOverrides((current) => ({
      ...current,
      [targetKey]: {
        ...current[targetKey],
        [role]: nextExpanded,
      },
    }))
  }

  return {
    endedExpanded: getExpanded('ended'),
    toggleEnded: () => {
      toggle('ended')
    },
    toggleUpcoming: () => {
      toggle('upcoming')
    },
    upcomingExpanded: getExpanded('upcoming'),
  }
}
