import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'

import {AwakenerDetailModalTabContent} from './AwakenerDetailModalTabContent'

vi.mock('..', () => ({
  AwakenerBuildsTab: ({awakenerId}: {awakenerId: number}) => <div>Builds {awakenerId}</div>,
  AwakenerDetailCards: ({skillLevel}: {skillLevel: number}) => <div>Cards {skillLevel}</div>,
  AwakenerDetailOverview: ({mode}: {mode: 'copies' | 'talents'}) => <div>Overview {mode}</div>,
  AwakenerTeamsTab: () => <div>Teams placeholder</div>,
}))

const TEST_AWAKENER = {id: 7, name: 'alpha'} as Awakener
const TEST_FULL_DATA = {id: 7} as AwakenerFull
const TEST_STATS = {CON: '100', BaseAliemus: '100'} as AwakenerFullStats

describe('AwakenerDetailModalTabContent', () => {
  it('routes copies and talents tabs to the overview component', () => {
    const {rerender} = render(
      <AwakenerDetailModalTabContent
        activeTab='copies'
        awakener={TEST_AWAKENER}
        cardNames={new Set(['Strike'])}
        fontScale='medium'
        fullData={TEST_FULL_DATA}
        onNavigateToCards={vi.fn()}
        skillLevel={3}
        stats={TEST_STATS}
      />,
    )

    expect(screen.getByText('Overview copies')).toBeInTheDocument()

    rerender(
      <AwakenerDetailModalTabContent
        activeTab='talents'
        awakener={TEST_AWAKENER}
        cardNames={new Set(['Strike'])}
        fontScale='medium'
        fullData={TEST_FULL_DATA}
        onNavigateToCards={vi.fn()}
        skillLevel={3}
        stats={TEST_STATS}
      />,
    )

    expect(screen.getByText('Overview talents')).toBeInTheDocument()
  })

  it('renders cards, builds, and teams tabs with the expected props', () => {
    const {rerender} = render(
      <AwakenerDetailModalTabContent
        activeTab='cards'
        awakener={TEST_AWAKENER}
        cardNames={new Set(['Strike'])}
        fontScale='small'
        fullData={TEST_FULL_DATA}
        onNavigateToCards={vi.fn()}
        skillLevel={5}
        stats={TEST_STATS}
      />,
    )

    expect(screen.getByText('Cards 5')).toBeInTheDocument()

    rerender(
      <AwakenerDetailModalTabContent
        activeTab='builds'
        awakener={TEST_AWAKENER}
        cardNames={new Set(['Strike'])}
        fontScale='small'
        fullData={TEST_FULL_DATA}
        onNavigateToCards={vi.fn()}
        skillLevel={5}
        stats={TEST_STATS}
      />,
    )

    expect(screen.getByText('Builds 7')).toBeInTheDocument()

    rerender(
      <AwakenerDetailModalTabContent
        activeTab='teams'
        awakener={TEST_AWAKENER}
        cardNames={new Set(['Strike'])}
        fontScale='small'
        fullData={TEST_FULL_DATA}
        onNavigateToCards={vi.fn()}
        skillLevel={5}
        stats={TEST_STATS}
      />,
    )

    expect(screen.getByText('Teams placeholder')).toBeInTheDocument()
  })
})
