import type {AwakenerProfileStorySection} from './awakeners-full'

export type AwakenerLoreRoute =
  | {section: 'intro' | 'skills'}
  | {section: 'stories'; story?: string}
  | {section: 'quotes'; category?: 'daily' | 'battle' | 'traphase'}

export type AwakenerLoreSection = AwakenerLoreRoute['section']

export function parseAwakenerLoreRoute(segments: readonly string[]): AwakenerLoreRoute {
  const [section = '', entry = ''] = segments.map((segment) => segment.trim().toLowerCase())
  if (section === 'stories') return {section, ...(entry ? {story: entry} : {})}
  if (section === 'quotes') {
    return {
      section,
      ...(['daily', 'battle', 'traphase'].includes(entry)
        ? {category: entry as 'daily' | 'battle' | 'traphase'}
        : {}),
    }
  }
  return {section: section === 'skills' ? 'skills' : 'intro'}
}

export function buildAwakenerLoreSuffix(route: AwakenerLoreRoute = {section: 'intro'}): string {
  const entry =
    route.section === 'stories'
      ? route.story
      : route.section === 'quotes'
        ? route.category
        : undefined
  return `${route.section}${entry ? `/${encodeURIComponent(entry)}` : ''}`
}

export function getAwakenerStorySlug(story: AwakenerProfileStorySection, index: number): string {
  return (
    story.title
      .replace(/^story\s*:?\s*/i, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || String(index + 1)
  )
}

export function validateAwakenerLoreStory(
  route: AwakenerLoreRoute,
  stories: readonly AwakenerProfileStorySection[],
): AwakenerLoreRoute {
  if (route.section !== 'stories' || !route.story) return route
  return stories
    .filter((story) => story.kind === 'story')
    .some((story, index) => getAwakenerStorySlug(story, index) === route.story)
    ? route
    : {section: 'stories'}
}
