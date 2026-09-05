import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {loadAwakenerQuoteExchange} from '@/domain/awakener-lore'
import type {AwakenerQuote} from '@/domain/awakeners-full'

import {AwakenerDetailLore} from './AwakenerDetailLore'
import {
  makeTestAwakener,
  makeTestAwakenerFullRecord,
  makeSkillRecord,
} from './database-test-fixtures'

vi.mock('@/domain/awakener-lore', () => ({loadAwakenerQuoteExchange: vi.fn()}))

const LOCAL_QUOTE: AwakenerQuote = {
  id: 'local',
  title: 'Chat: About Thais',
  content: 'Local reply.',
  unlockCondition: 'Unlock after triggering this dialogue in Traphase',
  exchange: [
    {awakenerId: 'awakener-0048', lineId: 'other'},
    {awakenerId: 'awakener-0005', lineId: 'local'},
  ],
}
const awakening = makeTestAwakener({id: 5, name: 'aurita'})
const fullData = makeTestAwakenerFullRecord({
  id: 5,
  displayName: 'Aurita',
  cards: {
    C1: makeSkillRecord({id: 'rouse', kind: 'rouse', displayName: 'Rouse'}),
    C2: makeSkillRecord({id: 'command1', kind: 'command', displayName: 'Command one'}),
    C3: makeSkillRecord({id: 'command2', kind: 'command', displayName: 'Command two'}),
    C4: makeSkillRecord({id: 'strike', kind: 'strike', displayName: 'Strike'}),
    C5: makeSkillRecord({id: 'defense', kind: 'defense', displayName: 'Defense'}),
    Exalt: makeSkillRecord({
      id: 'exalt',
      kind: 'exalt',
      displayName: 'Exalt',
      lore: 'Exalt story text.',
    }),
    promotedExtras: [],
  },
  profile: {
    storySections: [
      {
        kind: 'introduction',
        title: 'Basic Information',
        content: 'An introduction.',
        unlockCondition: 'Awakener Level 1',
      },
      {kind: 'story', title: 'Story: I', content: 'First complete story.'},
      {
        kind: 'story',
        title: 'Story: II',
        content: '<Italic:Arithmetic: Zero points.> <Bold:English: Failing.>',
        unlockCondition: 'Affinity Level 5',
      },
    ],
    voiceLines: {
      daily: [
        {
          id: 'daily',
          title: 'Greeting',
          content: 'Good morning.',
          unlockCondition: 'Affinity Level 9',
        },
      ],
      battle: [{id: 'battle', title: 'Victory', content: 'A battle quote.'}],
      traphase: [LOCAL_QUOTE],
    },
  },
})
fullData.cards.Exalt = {
  ...fullData.cards.Exalt,
  displayName: 'Exalt name',
  lore: 'Exalt story text.',
}

function openQuotes() {
  fireEvent.click(screen.getByRole('tab', {name: 'Quotes'}))
}

describe('Awakener Lore reading sections', () => {
  beforeEach(() => {
    vi.mocked(loadAwakenerQuoteExchange).mockReset()
  })

  it('starts with Intro and switches one complete story at a time without lock gates', () => {
    render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
    expect(screen.getByText('An introduction.')).toBeInTheDocument()
    expect(screen.queryByText('Awakener Level 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', {name: 'Section index'})).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', {name: 'Stories'}))
    expect(screen.getByText('First complete story.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Story II'}))
    expect(screen.queryByText('First complete story.')).not.toBeInTheDocument()
    expect(screen.getByText('Affinity Level 5')).toBeInTheDocument()
    expect(screen.getByText('Arithmetic: Zero points.').tagName).toBe('EM')
    expect(screen.getByText('English: Failing.').tagName).toBe('STRONG')
    expect(screen.queryByLabelText(/locked/i)).not.toBeInTheDocument()
  })

  it('supports keyboard section navigation with connected tabs and panel', () => {
    render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
    const intro = screen.getByRole('tab', {name: 'Intro'})
    intro.focus()
    fireEvent.keyDown(intro, {key: 'ArrowRight'})
    const stories = screen.getByRole('tab', {name: 'Stories'})
    expect(stories).toHaveFocus()
    expect(stories).toHaveAttribute('aria-selected', 'true')
    expect(stories).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id)
    fireEvent.keyDown(stories, {key: 'End'})
    expect(screen.getByRole('tab', {name: 'Skills'})).toHaveFocus()
    expect(screen.getByText('Exalt story text.')).toBeInTheDocument()
  })

  it('navigates adjacent stories from the footer at their beginning, including revisits', () => {
    render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
    fireEvent.click(screen.getByRole('tab', {name: 'Stories'}))
    const reader = screen.getByRole('region', {name: 'Reading area'})
    expect(screen.queryByRole('button', {name: /^Previous:/})).not.toBeInTheDocument()
    reader.scrollTop = 400
    fireEvent.scroll(reader)
    fireEvent.click(screen.getByRole('button', {name: 'Next: Story II'}))
    expect(reader.scrollTop).toBe(0)
    expect(screen.getByRole('heading', {name: 'Story II'}).closest('article')).toHaveFocus()
    expect(screen.queryByRole('button', {name: /^Next:/})).not.toBeInTheDocument()
    reader.scrollTop = 250
    fireEvent.scroll(reader)
    fireEvent.click(screen.getByRole('button', {name: 'Previous: Story I'}))
    expect(reader.scrollTop).toBe(0)
    expect(screen.getByRole('heading', {name: 'Story I'}).closest('article')).toHaveFocus()
  })

  it('renders all quote categories and never fetches an exchange until requested', async () => {
    vi.mocked(loadAwakenerQuoteExchange).mockResolvedValue([
      {
        awakenerId: 'awakener-0048',
        speakerName: 'Thais',
        quote: {id: 'other', title: 'Reply', content: 'First speaker.'},
      },
      {awakenerId: 'awakener-0005', speakerName: 'Aurita', quote: LOCAL_QUOTE},
    ])
    render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
    openQuotes()
    expect(screen.getByText('Good morning.')).toBeInTheDocument()
    const greeting = screen.getByRole('heading', {name: 'Greeting'}).closest('article')
    if (!greeting) throw new Error('Missing greeting article')
    expect(within(greeting).getByText('Affinity Level 9')).toBeInTheDocument()
    expect(within(greeting).getByText('Unlock condition:')).toHaveClass('sr-only')
    const victory = screen.getByRole('heading', {name: 'Victory'}).closest('article')
    if (!victory) throw new Error('Missing victory article')
    expect(within(victory).queryByText('Unlock condition:')).not.toBeInTheDocument()
    expect(screen.getByText('A battle quote.')).toBeInTheDocument()
    expect(screen.getByText('Local reply.')).toBeInTheDocument()
    expect(
      screen.getByText('Unlock after triggering this dialogue in Traphase'),
    ).toBeInTheDocument()
    expect(loadAwakenerQuoteExchange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'Read full exchange'}))
    const exchange = await screen.findByRole('region', {name: 'Full exchange'})
    expect(exchange.textContent).toMatch(/Thais.*First speaker.*Aurita.*Local reply/s)
    expect(screen.getAllByText('Local reply.')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', {name: 'Hide exchange'}))
    expect(screen.queryByText('First speaker.')).not.toBeInTheDocument()
    expect(screen.getByText('Local reply.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Read full exchange'}))
    expect(loadAwakenerQuoteExchange).toHaveBeenCalledTimes(1)
  })

  it('preserves repeated source lines in an expanded exchange', async () => {
    const line = {awakenerId: 'awakener-0005', speakerName: 'Aurita', quote: LOCAL_QUOTE}
    vi.mocked(loadAwakenerQuoteExchange).mockResolvedValue([line, line])
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
      openQuotes()
      fireEvent.click(screen.getByRole('button', {name: 'Read full exchange'}))
      const exchange = await screen.findByRole('region', {name: 'Full exchange'})
      expect(within(exchange).getAllByText('Local reply.')).toHaveLength(2)
      expect(errors).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', {name: 'Hide exchange'}))
      expect(screen.getAllByText('Local reply.')).toHaveLength(1)
    } finally {
      errors.mockRestore()
    }
  })
  it('keeps the original quote available on failure and retries on request', async () => {
    vi.mocked(loadAwakenerQuoteExchange)
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce([
        {awakenerId: 'awakener-0005', speakerName: 'Aurita', quote: LOCAL_QUOTE},
      ])
    render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
    openQuotes()
    fireEvent.click(screen.getByRole('button', {name: 'Read full exchange'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load')
    expect(screen.getByText('Local reply.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Retry exchange'}))
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    expect(
      within(screen.getByRole('region', {name: 'Full exchange'})).getByText('Aurita'),
    ).toBeInTheDocument()
  })

  it('resets lore selection when the character changes and handles older empty profiles', () => {
    const {rerender} = render(<AwakenerDetailLore awakener={awakening} fullData={fullData} />)
    openQuotes()
    rerender(
      <AwakenerDetailLore
        awakener={makeTestAwakener({id: 2, name: 'agrippa'})}
        fullData={makeTestAwakenerFullRecord({
          ...fullData,
          id: 2,
          displayName: 'Agrippa',
          profile: {},
        })}
      />,
    )
    expect(screen.getByRole('tab', {name: 'Intro'})).toHaveAttribute('aria-selected', 'true')
    openQuotes()
    expect(screen.getByText('No quotes are available yet.')).toBeInTheDocument()
    expect(screen.queryByText('Local reply.')).not.toBeInTheDocument()
  })
})
