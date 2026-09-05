import {describe, expect, it} from 'vitest'

import {parseAwakenerLoreRoute, validateAwakenerLoreStory} from './awakener-lore-routes'
import {buildDatabaseAwakenerPath} from './database-paths'

describe('Awakener lore routes', () => {
  it.each([
    [[], '/intro'],
    [['Intro'], '/intro'],
    [['stories', 'IV'], '/stories/iv'],
    [['quotes', 'Traphase'], '/quotes/traphase'],
    [['quotes', 'unknown'], '/quotes'],
    [['skills'], '/skills'],
    [['unknown'], '/intro'],
  ])('normalizes section paths %j', (segments, suffix) => {
    expect(
      buildDatabaseAwakenerPath({name: 'Aurita'}, 'lore', parseAwakenerLoreRoute(segments)),
    ).toBe(`/database/awakeners/aurita/lore${suffix}`)
  })
  it('validates chapter availability against the loaded profile', () => {
    const stories = [{kind: 'story' as const, title: 'Story: IV', content: 'Fourth story.'}]
    expect(validateAwakenerLoreStory({section: 'stories', story: 'iv'}, stories)).toEqual({
      section: 'stories',
      story: 'iv',
    })
    expect(validateAwakenerLoreStory({section: 'stories', story: 'v'}, stories)).toEqual({
      section: 'stories',
    })
    expect(validateAwakenerLoreStory({section: 'stories', story: 'iv'}, [])).toEqual({
      section: 'stories',
    })
  })
})
