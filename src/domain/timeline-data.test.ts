import {describe, expect, it} from 'vitest'

import rawBanners from '@/data/timeline/banners.json'
import rawEvents from '@/data/timeline/events.json'

import {getBannerDailyScheduleEntry, shouldDisplayEndedEventInArchive} from './timeline'
import {
  resolveTimelineBannerDerivedPool,
  resolveTimelineBannerPoolSlots,
} from './timeline-banner-pools'
import {
  loadTimelineBanners,
  loadTimelineEvents,
  timelineBanners,
  timelineEvents,
  validateTimelineLinks,
} from './timeline-data'

describe('timeline data loading', () => {
  it('validates and converts optional key dates', () => {
    const event = {
      id: 'key-date-test',
      title: 'Key date',
      startDate: '2026/11/01 09:00',
      endDate: '2026/11/30 09:00',
      keyDates: [{label: 'Claims until', date: '2026/12/07 09:00'}],
    }
    expect(loadTimelineEvents([event])[0].keyDates).toEqual([
      {label: 'Claims until', date: '2026-12-07T01:00:00.000Z'},
    ])
    expect(() => loadTimelineEvents([{...event, keyDates: [{label: '', date: 'bad'}]}])).toThrow()
  })
  it('keeps the November Kaleido pools and shared milestones tied to that run', () => {
    const event = timelineEvents.find(({id}) => id === 'constellated-memories-261116')
    expect(event?.missions).toEqual([
      ...[50, 100, 150].map((n) => ({
        label: `${String(n)} total awakenings`,
        standard: [{name: 'Gnosis Primer', amount: '×1'}],
      })),
      {label: '250 total awakenings', standard: [{name: 'Refined Gnosis Primer', amount: '×1'}]},
    ])
    expect(
      event?.related?.map((id) =>
        timelineBanners
          .find((banner) => banner.id === id)
          ?.poolSlots?.map((slot) => slot.pool.length),
      ),
    ).toEqual([
      [15, 15],
      [19, 19],
    ])
  })
  it('rejects duplicate IDs and unresolved cross-links', () => {
    expect(() => {
      validateTimelineLinks([{id: 'a'}, {id: 'a'}])
    }).toThrow(/Duplicate timeline ID/)
    expect(() => {
      validateTimelineLinks([{id: 'a', related: ['missing']}])
    }).toThrow(/missing ID/)
    expect(() => {
      validateTimelineLinks([{id: 'a', related: ['b']}, {id: 'b'}])
    }).not.toThrow()
  })

  it('rejects an event when an explicit artwork variant is missing', () => {
    expect(() =>
      loadTimelineEvents([
        {
          id: 'event-test',
          title: 'Test event',
          startDate: '2026/03/09 09:00',
          endDate: '2026/03/12 09:00',
          artVariants: {
            card: '/events/not-present.webp',
            detail: '/events/aquamarine-dream-detail.webp',
          },
        },
      ]),
    ).toThrow(/missing bundled card or detail art/)
  })
  it('loads all sixteen anniversary login claims, verified Archives and separate capture logs', () => {
    const stars = timelineEvents.find(({id}) => id === 'to-the-stars-260518')
    expect(stars?.rewards?.[0]?.layout).toBe('days')
    expect(stars?.rewards?.[0]?.items).toEqual(
      Array.from({length: 16}, () => ({name: 'To the Stars', amount: '×1'})),
    )
    const rendezvous = timelineEvents.find(({id}) => id === 'dreamy-rendezvous-260518')
    expect(rendezvous?.pricing).toBe('3980 Silver Prime')
    expect(rendezvous?.missions?.at(-1)).toMatchObject({
      standard: expect.arrayContaining([{name: 'Saya', amount: '×1'}]),
      premium: expect.arrayContaining([
        {name: 'Soul Rewind Core', amount: '×1'},
        {name: 'Fate Rewind Core', amount: '×1'},
      ]),
    })
    const meowch = timelineEvents.find(({id}) => id === 'meowch-obliged-260518')
    expect(meowch?.rewards?.map(({title}) => title)).toEqual([
      'Personal Capture Log',
      'Campus Capture Log',
    ])
    expect(meowch?.missions).toHaveLength(10)
    expect(meowch?.missions?.at(-1)?.label).toBe('Campus: 1,000,000 total captures')
    for (const event of [stars, rendezvous, meowch]) {
      expect(event?.artVariants).toEqual({
        card: expect.stringContaining('-card.webp'),
        detail: expect.stringContaining('-detail.webp'),
      })
    }
  })
  it.each([
    ['crimson-heartwood-260223', 'Crimson Kaede', '980 Silver Prime', 9],
    ['spikenard-myrrh-260406', 'With Spikenard and Myrrh', 'Free', 6],
    ['ouverture-260615', 'Ouvertüre Universell', 'Free', 6],
    ['no-candy-no-tricks-261019', 'Candy Snatcher', '480-1980 Silver Prime', 0],
  ])('loads verified skin rewards and art for %s', (id, skin, price, missions) => {
    const entry = timelineEvents.find(({id: eventId}) => eventId === id)
    expect(entry?.pricing).toBe(price)
    expect(entry?.missions ?? []).toHaveLength(missions)
    expect(entry?.rewards?.flatMap(({items}) => items)).toContainEqual({name: skin, amount: '×1'})
    expect(entry?.artVariants).toEqual({
      card: expect.stringContaining('-card.webp'),
      detail: expect.stringContaining('-detail.webp'),
    })
    if (id === 'crimson-heartwood-260223') {
      expect(entry?.title).toBe('Crimson Heartwood')
      expect(entry?.endDate).toBe('2026-03-23T01:00:00.000Z')
      expect(entry?.missions?.at(-1)).toMatchObject({
        label: 'Log in for 15 days',
        premium: expect.arrayContaining([{name: skin, amount: '×1'}]),
      })
    }
  })
  it.each([
    [
      'conjugated-fates-260406',
      'Conjugated Fates',
      '"Moirae Weaver" avatar',
      '2026-04-20',
      'May 17',
      null,
    ],
    [
      'unfading-memories-260518',
      'Unfading Memories',
      '"Bon Appetite" avatar',
      '2026-05-30',
      'Jun 26',
      '2026-07-06',
    ],
    [
      'myriad-wishcraft-260810',
      'Myriad Wishcraft',
      '"Trickery in Motion" avatar',
      '2026-08-24',
      'Sep 20',
      '2026-09-28',
    ],
    [
      'sneaky-witch-261012',
      "Sneaky Witch O'Clock",
      '"Do Not Knock" avatar',
      '2026-10-19',
      'Nov 15',
      '2026-11-23',
    ],
  ])(
    'preserves the verified preorder dates, avatar and rewards for %s',
    (id, title, avatar, early, last, claimsEnd) => {
      const entry = timelineEvents.find((event) => event.id === id)
      expect(entry?.title).toBe(title)
      expect(entry?.pricing).toBe('1980 Silver Prime')
      const [free, paid, bonus] = entry?.rewards ?? []
      expect(free.items).toEqual([{name: 'Silver', amount: '×100'}])
      expect(paid.claims).toHaveLength(7)
      expect(paid.claims?.at(0)?.label).toBe('On purchase')
      expect(paid.claims?.at(-1)?.label).toBe(last)
      expect(paid.items).toContainEqual({name: 'Luminous Core', amount: '×30'})
      expect(entry?.keyDates).toEqual([
        {label: 'Early bonus until', date: `${early}T01:00:00.000Z`},
        ...(claimsEnd ? [{label: 'Claims until', date: `${claimsEnd}T01:00:00.000Z`}] : []),
      ])
      expect(bonus.items).toContainEqual({name: avatar, amount: '×1'})
      expect(entry?.artVariants).toEqual({
        card: expect.stringContaining('-card.webp'),
        detail: expect.stringContaining('-detail.webp'),
      })
    },
  )
  it.each([
    ['lucky-winner-260309', 980, 25, 25],
    ['heure-du-the-260420', 980, 25, 25],
    ['blossom-court-260518', 980, 25, 25],
    ['wonderland-diary-260629', 1680, 30, 60],
    ['witness-to-all-260727', 1680, 30, 60],
    ['after-school-260824', 1680, 30, 60],
    ['born-in-darkness-260921', 1680, 30, 60],
    ['soul-anatomist-261019', 1680, 30, 60],
    ['aquamarine-dream-261116', 1680, 30, 60],
  ])('loads both verified Archive tracks for %s', (id, price, pure, luminous) => {
    const event = timelineEvents.find((entry) => entry.id === id)
    expect(event?.pricing).toBe(`${String(price)} Silver Prime`)
    expect(event?.missions).toHaveLength(8)
    expect(event?.rewards?.map(({title, items}) => [title, items[0]?.amount])).toEqual([
      ['Standard Archives', '×4'],
      ['Premium Archives adds', '×12'],
    ])
    for (const [track, core, total] of [
      ['standard', 'Pure Core', pure],
      ['premium', 'Luminous Core', luminous],
    ] as const) {
      const items = event?.missions?.flatMap((mission) => mission[track] ?? []) ?? []
      expect(
        items
          .filter(({name}) => name === core)
          .reduce((sum, item) => sum + Number(item.amount?.slice(1)), 0),
      ).toBe(total)
      expect(
        items
          .filter(({name}) => name === event?.featured?.[0]?.name)
          .reduce((sum, item) => sum + Number(item.amount?.slice(1)), 0),
      ).toBe(track === 'standard' ? 4 : 12)
    }
    expect(event?.artVariants).toEqual({
      card: expect.stringContaining('-card.webp'),
      detail: expect.stringContaining('-detail.webp'),
    })
  })
  it('identifies Curriculum Term 40 and resolves both of its artwork variants', () => {
    const event = timelineEvents.find(({id}) => id === 'curriculum-261116')
    expect(event?.title).toBe('Curriculum Honor: Term 40')
    expect(event?.artVariants).toEqual({
      card: expect.stringContaining('curriculum-card.webp'),
      detail: expect.stringContaining('curriculum-detail.webp'),
    })
  })

  it('keeps legacy artwork only on entries without dedicated crops', () => {
    expect(
      rawEvents
        .filter((event) => Object.hasOwn(event, 'artVariants') && Object.hasOwn(event, 'customArt'))
        .map(({id}) => id),
    ).toEqual([])
    expect(timelineEvents.find(({id}) => id === 'mythag-gifts-260309')?.customArt).toContain(
      'gifts-from-mythag.webp',
    )
  })

  it('archives the cosmetic-bearing Curriculum terms without assuming early track totals', () => {
    const terms = timelineEvents
      .filter((event) => event.category === 'curriculum' && event.startDate < '2026-11-16')
      .sort((left, right) => left.startDate.localeCompare(right.startDate))

    expect(terms.map(({title}) => title)).toEqual(
      Array.from({length: 38}, (_, index) => `Curriculum Honor: Term ${String(index + 2)}`),
    )
    expect(terms.every(shouldDisplayEndedEventInArchive)).toBe(true)
    for (const [index, term] of terms.entries()) {
      if (index > 0) expect(term.startDate).toBe(terms[index - 1].endDate)
      expect(term.rewards?.at(-1)?.items.some(({itemId}) => itemId !== undefined)).toBe(true)
    }
    expect(terms[0].pricing).toBeUndefined()
    expect(terms[0].rewards?.map(({title}) => title)).toEqual(['Premium adds'])
    const short = terms.find(({id}) => id === 'curriculum-260406')
    expect(short?.rewards?.map(({price}) => price)).toEqual([
      'Free',
      '680 Silver Prime',
      '980 Silver Prime',
    ])
    const standard = terms.find(({id}) => id === 'curriculum-261019')
    expect(standard?.rewards?.at(-1)?.price).toBe('1,280 Silver Prime')
  })

  it('preserves reward groups and related IDs and rejects empty reward items', () => {
    const event = {
      id: 'event-test',
      title: 'Test',
      startDate: '2026/03/09 09:00',
      endDate: '2026/03/12 09:00',
      rewards: [{title: 'Login', layout: 'days', items: [{name: 'Core', amount: '×1'}]}],
      related: ['banner-test'],
    }
    expect(loadTimelineEvents([event])[0]).toMatchObject({
      rewards: event.rewards,
      related: event.related,
    })
    expect(() => loadTimelineEvents([{...event, rewards: [{items: []}]}])).toThrow()
    expect(
      loadTimelineBanners([
        {
          id: 'banner-test',
          title: 'Test',
          type: 'limited',
          startDate: event.startDate,
          endDate: event.endDate,
          related: ['event-test'],
        },
      ])[0].related,
    ).toEqual(['event-test'])
  })
  it('links the landed Vivian content and resolves the new event artwork', () => {
    const banner = timelineBanners.find((entry) => entry.id === 'vivian-duo-261019')
    expect(banner?.featured).toEqual([
      expect.objectContaining({name: 'Vivian', realmId: 'CHAOS', detailLink: undefined}),
      expect.objectContaining({name: "The Seer's Riddle", detailLink: undefined}),
    ])

    const story = timelineEvents.find((entry) => entry.id === 'then-there-were-none-261019')
    expect(story?.featured?.[0]).toMatchObject({
      name: 'Vivian',
      realmId: 'CHAOS',
      detailLink: undefined,
    })
    expect(story?.artVariants?.detail).toContain('and-then-there-were-none-detail.webp')

    const clinic = timelineEvents.find((entry) => entry.id === 'soul-anatomist-261019')
    expect(clinic?.featured?.[0]).toMatchObject({
      name: "Imago's Clinic",
      detailLink: undefined,
    })
    expect(clinic?.artVariants?.detail).toContain('soul-anatomist-detail.webp')
    expect(
      timelineEvents.find((entry) => entry.id === 'pickman-canvas-261102')?.artVariants?.detail,
    ).toContain('dark-side-of-the-canvas-detail.webp')
  })

  it('uses the game opening day rather than the UTC day or banner end for eligibility', () => {
    const [banner] = loadTimelineBanners([
      {
        id: 'test-opening-cutoff',
        title: 'Opening cutoff',
        type: 'combo',
        startDate: '2026/04/20 00:30',
        endDate: '2026/06/15 09:00',
        derivedPool: {availabilityTypes: ['LIMITED_ASTRAL_REIGN'], linkedPairs: true},
      },
    ])
    expect(banner.startDate).toBe('2026-04-19T16:30:00.000Z')
    const names = banner.poolSlots?.[0].pool.map((unit) => unit.name)
    expect(names).toContain('Arachne')
    expect(names).not.toContain('Saya')
    expect(names).not.toContain('Vivian')
  })

  it('preserves labels when copying manual pool slots', () => {
    const slots = resolveTimelineBannerPoolSlots(
      [{count: 2, label: 'Assault', pool: ['Arachne']}],
      {resolveCustomArt: () => undefined, wheels: []},
    )

    expect(slots).toHaveLength(2)
    expect(slots.map((slot) => slot.label)).toEqual(['Assault', 'Assault'])
  })

  it('loads split event featured entries and opt-out detail links', () => {
    const splitEvent = timelineEvents.find((event) => event.id === 'great-conquering-260504')
    const preorder = timelineEvents.find((event) => event.id === 'conjugated-fates-260406')

    expect(splitEvent?.featured).toMatchObject([
      {name: 'Agrippa', kind: 'awakener'},
      {name: 'Uvhash', kind: 'awakener'},
      {name: 'Voracious Resolve', kind: 'posse'},
    ])
    expect(splitEvent?.rewards?.[0]?.items.map((item) => item.name)).toEqual([
      'Silver',
      'Aetheric Shard',
      'Dreamshard',
    ])
    expect(preorder?.featured?.[0]).toMatchObject({name: 'Arachne', detailLink: false})
  })

  it('loads anniversary and collab timeline surfaces', () => {
    const anniversaryLogin = timelineEvents.find((event) => event.id === 'to-the-stars-260518')
    const dreamyRendezvous = timelineEvents.find((event) => event.id === 'dreamy-rendezvous-260518')
    const meowch = timelineEvents.find((event) => event.id === 'meowch-obliged-260518')
    const giftBoxes = timelineEvents.find((event) => event.id === 'new-arrivals-boxes-260518')
    const preorder = timelineEvents.find((event) => event.id === 'unfading-memories-260518')
    const season33Login = timelineEvents.find((event) => event.id === 'mythag-gifts-260518')
    const season34Curriculum = timelineEvents.find((event) => event.id === 'curriculum-260615')
    const collabEvent = timelineEvents.find((event) => event.id === 'inverted-rebirth-260530')
    const collabSideStory = timelineEvents.find((event) => event.id === 'seed-of-love-260530')
    const collabBanner = timelineBanners.find((banner) => banner.id === 'saya-collab-260530')

    expect(anniversaryLogin).toMatchObject({
      category: 'anniversary',
      endDate: '2026-06-29T01:00:00.000Z',
      startDate: '2026-05-18T01:00:00.000Z',
      title: 'To the Stars',
    })
    expect(dreamyRendezvous).toMatchObject({
      category: 'anniversary',
      pricing: '3980 Silver Prime',
      title: 'Dreamy Rendezvous',
    })
    expect(meowch).toMatchObject({
      category: 'anniversary',
      endDate: '2026-06-29T01:00:00.000Z',
      startDate: '2026-05-18T01:00:00.000Z',
    })
    expect(meowch?.description).toContain('New entries close Jun 15')
    expect(meowch?.description).toContain('14 days after the campus reaches that goal')
    expect(giftBoxes).toMatchObject({
      category: 'bundle',
      pricing: '688-2688 Silver Prime',
      title: 'New Arrivals Gift Boxes',
    })
    expect(giftBoxes?.endDate).toBe('2026-06-29T01:00:00.000Z')
    expect(
      giftBoxes?.rewards?.map(({title, price, summaryCount, choiceCount}) => [
        title,
        price,
        summaryCount,
        choiceCount,
      ]),
    ).toEqual([
      ['Ode in Embers', '1280 Silver Prime', undefined, undefined],
      ['Celestial Accord', '1280 Silver Prime', undefined, undefined],
      ['Summer Fireworks', '688 Silver Prime', 3, 2],
      ['Summer Matsuri', '2688 Silver Prime', 3, 3],
    ])
    expect(preorder).toMatchObject({
      category: 'preorder',
      pricing: '1980 Silver Prime',
      title: 'Unfading Memories',
    })
    expect(season33Login).toMatchObject({
      category: 'login',
      endDate: '2026-06-15T01:00:00.000Z',
      startDate: '2026-05-18T01:00:00.000Z',
      title: 'Gifts from Mythag',
    })
    expect(season34Curriculum).toMatchObject({
      category: 'curriculum',
      endDate: '2026-06-29T01:00:00.000Z',
      startDate: '2026-06-15T01:00:00.000Z',
      title: 'Curriculum Honor: Term 34',
    })
    expect(season34Curriculum?.description).toContain('double Topic EXP')
    expect(collabEvent).toMatchObject({
      category: 'gameplay-event',
      endDate: '2026-08-24T01:00:00.000Z',
      startDate: '2026-05-30T01:00:00.000Z',
      title: 'Inverted Rebirth',
    })
    expect(collabBanner).toMatchObject({
      endDate: '2026-08-24T01:00:00.000Z',
      pinned: true,
      startDate: '2026-05-30T01:00:00.000Z',
      tags: ['awaken', 'collab'],
      title: 'Sprout of Liebestod / Alien Crypsela',
      type: 'awaken',
    })
    expect(collabBanner?.customArt).toBeUndefined()
    expect(collabBanner?.featured).toMatchObject([
      {kind: 'awakener', name: 'Saya'},
      {kind: 'wheel', name: 'Fragrant Morphogenesis'},
    ])
    expect(anniversaryLogin?.artVariants?.detail).toContain('to-the-star-detail.webp')
    expect(dreamyRendezvous?.artVariants?.detail).toContain('dreamy-rendezvous-detail.webp')
    expect(collabEvent?.artVariants?.detail).toContain('saya-event-detail.webp')
    expect(collabSideStory).toMatchObject({
      category: 'story',
      endDate: '2026-08-24T01:00:00.000Z',
      pricing: 'Free during event',
      startDate: '2026-05-30T01:00:00.000Z',
      title: 'Forgotten Seed of Love',
      featured: [{name: 'For the New World', kind: 'posse'}],
    })
    expect(collabSideStory?.artVariants?.detail).toContain('forgotten-seed-detail.webp')
    expect(collabSideStory?.description).toContain('Permanent Multiverse Link side story')
    expect(collabBanner?.preliminary).toBeUndefined()
  })

  it('keeps anniversary milestone thresholds and rewards in order', () => {
    const dreamy = timelineEvents.find((event) => event.id === 'dreamy-offering-260518')
    const stream = timelineEvents.find((event) => event.id === 'stream-infatuation-260518')
    expect(dreamy?.missions?.map((tier) => [tier.label, tier.standard[0]?.amount])).toEqual([
      ['100 Awakens', '×100'],
      ['250 Awakens', '×200'],
      ['500 Awakens', '×300'],
      ['1,000 Awakens', '×400'],
    ])
    expect(
      stream?.missions?.map((tier) => [tier.label, tier.standard.map((item) => item.name)]),
    ).toEqual([
      [
        '5,000 Silver Prime extracted',
        ['Ultra Mapping: Astral Reign', 'Ultra Prophecy: Astral Reign'],
      ],
      ['10,000 Silver Prime extracted', ['Caro Birth: Astral Reign', 'Caro Whisper: Astral Reign']],
      [
        '20,000 Silver Prime extracted',
        ['Aequor Mystery: Astral Reign', 'Aequor Codex: Astral Reign'],
      ],
      [
        '30,000 Silver Prime extracted',
        ['Chaos Echo: Astral Reign', 'Chaos Experiment: Astral Reign', 'Sprout of Love'],
      ],
    ])
  })

  it('enables database details for the current Lotan and Falling Upward timeline entries', () => {
    const lotanBanner = timelineBanners.find((banner) => banner.id === 'lotan-duo-260727')
    const lotanEvent = timelineEvents.find((event) => event.id === 'cetus-falls-260727')
    const fallingUpwardEvent = timelineEvents.find((event) => event.id === 'witness-to-all-260727')

    expect(lotanBanner?.featured).toMatchObject([
      {
        customArt: undefined,
        detailLink: undefined,
        kind: 'awakener',
        name: 'Lotan: Cetarchon',
      },
      {customArt: undefined, detailLink: undefined, kind: 'wheel', name: 'Cetus Occasus'},
    ])
    expect(lotanEvent?.featured).toMatchObject([
      {kind: 'awakener', name: 'Lotan: Cetarchon', detailLink: undefined},
      {kind: 'wheel', name: 'Undying Hungerbone'},
      {kind: 'posse', name: 'Cetus-Devouring Storm'},
    ])
    expect(lotanEvent?.rewards?.slice(0, 2).map((group) => group.items[0])).toEqual([
      {name: 'Undying Hungerbone', amount: '×6'},
      {name: 'Undying Hungerbone', amount: '×10'},
    ])
    const helot = timelineEvents.find((event) => event.id === 'til-snow-melts-260713')
    expect(helot?.rewards?.slice(0, 2).map((group) => group.items[0])).toEqual([
      {name: 'Til the Snow Melts', amount: '×7'},
      {name: 'Til the Snow Melts', amount: '×9'},
    ])
    expect(fallingUpwardEvent?.featured).toMatchObject([
      {kind: 'wheel', name: 'Falling Upward', detailLink: undefined},
    ])
  })

  it('enables released Caraboo timeline details without prerelease realm overrides', () => {
    const carabooBanner = timelineBanners.find((banner) => banner.id === 'caraboo-duo-260824')
    const carabooEvent = timelineEvents.find((event) => event.id === 'new-moon-snow-260824')
    const soulSynchronizationEvent = timelineEvents.find(
      (event) => event.id === 'after-school-260824',
    )

    expect(carabooBanner?.featured).toMatchObject([
      {kind: 'awakener', name: 'Caraboo', detailLink: undefined, realmId: undefined},
      {kind: 'wheel', name: 'Honeyed Deceit', detailLink: undefined},
    ])
    expect(carabooEvent?.featured).toMatchObject([
      {kind: 'awakener', name: 'Caraboo', detailLink: undefined, realmId: undefined},
      {kind: 'wheel', name: 'Serene Truth'},
    ])
    expect(carabooEvent?.rewards?.slice(0, 2).map((group) => group.items[0])).toEqual([
      {name: 'Serene Truth', amount: '×7'},
      {name: 'Serene Truth', amount: '×9'},
    ])
    const suns = timelineEvents.find((event) => event.id === 'million-suns-260907')
    expect(suns?.rewards?.slice(0, 4).map((group) => group.items[0])).toEqual([
      {name: 'Impending Sun', amount: '×7'},
      {name: 'Impending Sun', amount: '×3'},
      {name: 'Impending Sun', amount: '×3'},
      {name: 'Impending Sun', amount: '×3'},
    ])
    expect(soulSynchronizationEvent?.featured).toMatchObject([
      {kind: 'wheel', name: 'Soul Synchronization', detailLink: undefined},
    ])
  })

  it('loads the announced Stars in Full Bloom pools including Genesis entries', () => {
    for (const [role, count] of [
      ['assault', 10],
      ['warden', 6],
      ['chorus', 12],
    ] as const) {
      const banner = timelineBanners.find(({id}) => id === `stars-bloom-${role}-260530`)
      expect(banner).toMatchObject({
        type: 'premium',
        pricing: 'USD 29.99',
        rulesProfile: 'triple-soiree',
      })
      expect(banner?.poolSlots?.map(({label, pool}) => [label, pool.length])).toEqual([
        ['Awakeners', count],
        ['Wheels', count],
      ])
    }
    expect(
      timelineBanners
        .find(({id}) => id === 'stars-bloom-assault-260530')
        ?.poolSlots?.[0]?.pool.map(({name}) => name),
    ).toContain('Helot: Catena')
  })

  it('loads the May Kaleido SSR pools with their limited Genesis entries', () => {
    const faded = timelineBanners.find(({id}) => id === 'kaleido-fl-260505')
    const astral = timelineBanners.find(({id}) => id === 'kaleido-ar-260518')

    for (const [banner, count] of [
      [faded, 15],
      [astral, 13],
    ] as const) {
      expect(banner?.rulesProfile).toBe('kaleido')
      expect(banner?.poolSlots?.map(({label, pool}) => [label, pool.length])).toEqual([
        ['Awakeners', count],
        ['Wheels', count],
      ])
    }
    expect(faded?.poolSlots?.[0]?.pool.map(({name}) => name)).toContain('Helot: Catena')
    expect(faded?.poolSlots?.[1]?.pool.map(({name}) => name)).toContain('Drowning in Crimson')
    expect(astral?.poolSlots?.[0]?.pool.map(({name}) => name)).toEqual(
      expect.arrayContaining(['Doll: Inferno', 'Murphy: Fauxborn']),
    )
    expect(astral?.poolSlots?.[1]?.pool.map(({name}) => name)).toEqual(
      expect.arrayContaining(['Manikin of Oblivion', 'Uteri Somnia']),
    )
  })

  it('loads Echoing Wishes as a daily limited awakener and wheel schedule', () => {
    const echoingWishes = timelineBanners.find((banner) => banner.id === 'echoing-wishes-260518')
    const rawEchoingWishes = rawBanners.find((banner) => banner.id === 'echoing-wishes-260518')

    expect(echoingWishes).toMatchObject({
      tags: undefined,
      type: 'daily',
    })
    expect('derivedPool' in (rawEchoingWishes ?? {})).toBe(false)
    expect(echoingWishes?.poolSlots).toBeUndefined()
    expect(echoingWishes?.dailySchedule).toHaveLength(28)
    expect(echoingWishes?.rulesProfile).toBe('oathbound-oracle')
    for (const {featured, offBanner} of echoingWishes?.dailySchedule ?? []) {
      expect(featured.map(({kind}) => kind)).toEqual(['awakener', 'wheel'])
      expect(offBanner).toHaveLength(5)
      expect(offBanner?.every(({kind}) => kind === 'awakener')).toBe(true)
      expect(offBanner?.some(({name}) => name === featured[0]?.name)).toBe(false)
    }
    expect(echoingWishes?.dailySchedule?.[0]?.offBanner?.map(({name}) => name)).toEqual([
      'Goliath',
      'Faros',
      'Caecus',
      'Sanga',
      'Celeste',
    ])
    expect(echoingWishes?.dailySchedule?.[0]?.featured.map((unit) => unit.name)).toEqual([
      'Tulu',
      'Hymn of the Sovereign',
    ])
    expect(echoingWishes?.dailySchedule?.[13]?.featured.map((unit) => unit.name)).toEqual([
      'Helot: Catena',
      'Drowning in Crimson',
    ])
    expect(echoingWishes?.dailySchedule?.[27]?.featured.map((unit) => unit.name)).toEqual([
      'Arachne',
      'Eternal Weave',
    ])
    expect(echoingWishes).toBeDefined()
    if (!echoingWishes) {
      return
    }

    expect(
      getBannerDailyScheduleEntry(echoingWishes, new Date('2026-05-21T01:00:00.000Z')),
    ).toMatchObject({
      day: 4,
      featured: [
        {kind: 'awakener', name: 'Lily'},
        {kind: 'wheel', name: 'Grace Through Pain'},
      ],
    })
  })

  it('rejects daily banner schedules that do not match the date span', () => {
    expect(() =>
      loadTimelineBanners([
        {
          id: 'test-daily-gap',
          title: 'Test Daily Gap',
          type: 'daily',
          startDate: '2026/05/18 09:00',
          endDate: '2026/05/20 09:00',
          dailySchedule: [
            {day: 1, featured: ['Tulu']},
            {day: 3, featured: ['Arachne']},
          ],
        },
      ]),
    ).toThrow(/day must be 2/i)

    expect(() =>
      loadTimelineBanners([
        {
          id: 'test-daily-short',
          title: 'Test Daily Short',
          type: 'daily',
          startDate: '2026/05/18 09:00',
          endDate: '2026/05/21 09:00',
          dailySchedule: [
            {day: 1, featured: ['Tulu']},
            {day: 2, featured: ['Arachne']},
          ],
        },
      ]),
    ).toThrow(/3 entries/i)
  })

  it('normalizes derived pool filters and applies exclusions to existing units', () => {
    const [normalizedBanner, baselineBanner] = loadTimelineBanners([
      {
        id: 'test-derived-pool',
        title: 'Test Derived Pool',
        type: 'combo',
        startDate: '2026/05/18 09:00',
        endDate: '2026/06/15 09:00',
        derivedPool: {
          availabilityTypes: [' limited_astral_reign '],
          excludeNames: ['Arachne'],
          linkedPairs: true,
        },
      },
      {
        id: 'test-derived-pool-baseline',
        title: 'Test Derived Pool Baseline',
        type: 'combo',
        startDate: '2026/05/18 09:00',
        endDate: '2026/06/15 09:00',
        derivedPool: {
          availabilityTypes: ['LIMITED_ASTRAL_REIGN'],
          linkedPairs: true,
        },
      },
    ])

    const normalizedNames = normalizedBanner.poolSlots?.[0]?.pool.map((unit) => unit.name)
    const baselineNames = baselineBanner.poolSlots?.[0]?.pool.map((unit) => unit.name)

    expect(normalizedNames).toEqual(baselineNames?.filter((name) => name !== 'Arachne'))
    expect(normalizedNames).not.toContain('Arachne')
    expect(normalizedNames?.length).toBeGreaterThan(0)
  })

  it('filters derived pools by awakener gender', () => {
    const [slot] = resolveTimelineBannerDerivedPool(
      {
        availabilityTypes: ['LIMITED_TEST_POOL'],
        gender: ' female ',
        linkedPairs: true,
      },
      'test-gender-pool',
      {
        releaseDateCutoff: '2026-05-18',
        awakeners: [
          {
            aliases: ['Female Owner'],
            availabilityType: 'LIMITED_TEST_POOL',
            faction: 'test',
            gender: 'Female',
            id: 'awakener-9001',
            lineupToken: 'female-owner',
            name: 'Female Owner',
            releaseDate: '2026-05-18',
            rarity: 'SSR',
            realm: 'test',
            tags: [],
          },
          {
            aliases: ['Male Owner'],
            availabilityType: 'LIMITED_TEST_POOL',
            faction: 'test',
            gender: 'Male',
            id: 'awakener-9002',
            lineupToken: 'male-owner',
            name: 'Male Owner',
            releaseDate: '2026-05-18',
            rarity: 'SSR',
            realm: 'test',
            tags: [],
          },
        ],
        wheels: [
          {
            aliases: ['Female Wheel'],
            assetId: 'test-wheel',
            awakener: 'female owner',
            id: 'wheel-9001',
            lineupToken: 'female-wheel',
            mainstatKey: 'CRIT_RATE',
            name: 'Female Wheel',
            ownerAwakenerId: 'awakener-9001',
            rarity: 'SSR',
            realm: 'NEUTRAL',
            tags: [],
          },
        ],
      },
    )

    expect(slot.pool.map((unit) => unit.name)).toEqual(['Female Owner'])
  })

  it('derives independently filtered labeled slots and applies banner-wide exclusions', () => {
    const slots = resolveTimelineBannerDerivedPool(
      {
        availabilityTypes: ['LIMITED_ASTRAL_REIGN'],
        excludeNames: ['Caraboo'],
        slots: [
          {kind: 'awakener', label: 'Assault', limitedAwakenerType: 'ASSAULT', linked: true},
          {kind: 'awakener', label: 'Female', gender: 'Female', linked: true},
          {kind: 'wheel', label: 'Wheels', gender: 'Female', count: 2},
        ],
      },
      'test-bucket-pool',
      {
        releaseDateCutoff: '2026-05-18',
        awakeners: [
          {
            aliases: ['Eligible'],
            availabilityType: 'LIMITED_ASTRAL_REIGN',
            faction: 'test',
            gender: 'Female',
            id: 'awakener-9001',
            lineupToken: 'eligible',
            name: 'Eligible',
            releaseDate: '2026-05-18',
            rarity: 'SSR',
            realm: 'test',
            tags: [],
            type: 'ASSAULT',
          },
          {
            aliases: ['Caraboo'],
            availabilityType: 'LIMITED_ASTRAL_REIGN',
            faction: 'test',
            gender: 'Female',
            id: 'awakener-9002',
            lineupToken: 'caraboo',
            name: 'Caraboo',
            releaseDate: '2026-05-18',
            rarity: 'SSR',
            realm: 'test',
            tags: [],
            type: 'ASSAULT',
          },
        ],
        wheels: [
          {
            aliases: ['Eligible Wheel'],
            assetId: 'eligible-wheel',
            awakener: 'eligible',
            id: 'wheel-9001',
            lineupToken: 'eligible-wheel',
            mainstatKey: 'CRIT_RATE',
            name: 'Eligible Wheel',
            ownerAwakenerId: 'awakener-9001',
            rarity: 'SSR',
            realm: 'NEUTRAL',
            tags: [],
          },
          {
            aliases: ['Event Wheel'],
            assetId: 'event-wheel',
            awakener: 'eligible',
            id: 'wheel-9999',
            lineupToken: 'event-wheel',
            mainstatKey: 'DMG_AMP',
            name: 'Event Wheel',
            ownerAwakenerId: 'awakener-9001',
            rarity: 'SSR',
            realm: 'NEUTRAL',
            tags: [],
          },
        ],
      },
    )

    expect(slots).toHaveLength(4)
    expect(slots.map((slot) => slot.label)).toEqual(['Assault', 'Female', 'Wheels', 'Wheels'])
    expect(slots[0]).toMatchObject({linked: true, pool: [{name: 'Eligible'}]})
    expect(slots[1].pool.map((unit) => unit.name)).toEqual(['Eligible'])
    expect(slots[2].pool.map((unit) => unit.name)).toEqual(['Eligible Wheel'])
  })

  it('loads the five linked Stars Cradled Close buckets without expanding their data slots', () => {
    const banner = timelineBanners.find((entry) => entry.id === 'stars-cradled-260824')

    expect(banner?.linkedPresentation).toBe('paired')
    expect(banner?.rulesProfile).toBe('myriad-self-select')
    expect(banner?.poolSlots?.map(({label, pool}) => [label, pool.map(({name}) => name)])).toEqual([
      ['Assault', ['Lotan: Cetarchon', 'Mouchette', 'Kathigu-Ra', 'Vortice', 'Doresain', 'Pollux']],
      ['Warden', ['Pontos', 'Corposant', 'Castor']],
      [
        'Chorus',
        ['Doll: Inferno', 'Murphy: Fauxborn', 'Saya', 'Xu', 'Pickman', 'Arachne', 'Clementine'],
      ],
      ['Male', ['Pontos', 'Doresain', 'Pickman', 'Pollux', 'Castor']],
      [
        'Female',
        [
          'Lotan: Cetarchon',
          'Mouchette',
          'Kathigu-Ra',
          'Doll: Inferno',
          'Vortice',
          'Murphy: Fauxborn',
          'Corposant',
          'Saya',
          'Xu',
          'Arachne',
          'Clementine',
        ],
      ],
    ])
    expect(banner?.poolSlots).toHaveLength(5)
    expect(banner?.poolSlots?.map((slot) => slot.label)).toEqual([
      'Assault',
      'Warden',
      'Chorus',
      'Male',
      'Female',
    ])
    expect(banner?.poolSlots?.every((slot) => slot.linked)).toBe(true)
    expect(
      banner?.poolSlots?.flatMap((slot) => slot.pool).some((unit) => unit.name === 'Caraboo'),
    ).toBe(false)
  })

  it('loads Lightward Reminiscence from its actual class pools', () => {
    for (const [role, count] of [
      ['assault', 5],
      ['warden', 4],
      ['chorus', 6],
    ] as const) {
      const banner = timelineBanners.find(({id}) => id === `lightward-${role}-260824`)
      expect(banner).toMatchObject({
        type: 'premium',
        pricing: '980 Silver Prime',
        rulesProfile: 'fated-soiree',
      })
      expect(banner?.poolSlots?.map(({label, pool}) => [label, pool.length])).toEqual([
        ['Awakeners', count],
        ['Wheels', count],
      ])
    }
  })

  it('rejects ambiguous or empty derived banner pools', () => {
    expect(() =>
      loadTimelineBanners([
        {
          id: 'test-ambiguous-pool',
          title: 'Test Ambiguous Pool',
          type: 'combo',
          startDate: '2026/05/18 09:00',
          endDate: '2026/06/15 09:00',
          poolSlots: [{pool: ['Arachne']}],
          derivedPool: {
            availabilityTypes: ['LIMITED_ASTRAL_REIGN'],
            linkedPairs: true,
          },
        },
      ]),
    ).toThrow(/either poolSlots or derivedPool/i)

    expect(() =>
      loadTimelineBanners([
        {
          id: 'test-empty-derived-pool',
          title: 'Test Empty Pool',
          type: 'combo',
          startDate: '2026/05/18 09:00',
          endDate: '2026/06/15 09:00',
          derivedPool: {
            availabilityTypes: ['LIMITED_NOT_REAL'],
            linkedPairs: true,
          },
        },
      ]),
    ).toThrow(/empty linked pool/i)
  })

  it('rejects linkedPairs derived pools when a derived SSR awakener lacks an SSR wheel', () => {
    expect(() =>
      resolveTimelineBannerDerivedPool(
        {
          availabilityTypes: ['LIMITED_TEST_POOL'],
          linkedPairs: true,
        },
        'test-linked-missing-wheel',
        {
          releaseDateCutoff: '2026-05-18',
          awakeners: [
            {
              aliases: ['Wheel Owner'],
              availabilityType: 'LIMITED_TEST_POOL',
              faction: 'test',
              id: 'awakener-9001',
              lineupToken: 'wheel-owner',
              name: 'Wheel Owner',
              releaseDate: '2026-05-18',
              rarity: 'SSR',
              realm: 'test',
              tags: [],
            },
            {
              aliases: ['Missing Wheel'],
              availabilityType: 'LIMITED_TEST_POOL',
              faction: 'test',
              id: 'awakener-9002',
              lineupToken: 'missing-wheel',
              name: 'Missing Wheel',
              releaseDate: '2026-05-18',
              rarity: 'SSR',
              realm: 'test',
              tags: [],
            },
          ],
          wheels: [
            {
              aliases: ['Owned SSR Wheel'],
              assetId: 'test-wheel',
              awakener: 'wheel owner',
              id: 'wheel-9001',
              lineupToken: 'owned-ssr-wheel',
              mainstatKey: 'CRIT_RATE',
              name: 'Owned SSR Wheel',
              ownerAwakenerId: 'awakener-9001',
              rarity: 'SSR',
              realm: 'NEUTRAL',
              tags: [],
            },
          ],
        },
      ),
    ).toThrow(
      /Timeline banner "test-linked-missing-wheel" linkedPairs derivedPool includes awakeners without SSR wheels: Missing Wheel\./,
    )
  })

  it('loads Song of Perennial Wandering Hameln rerun teasers', () => {
    const skin = timelineEvents.find((event) => event.id === 'ouverture-260615')
    const rerunEvent = timelineEvents.find((event) => event.id === 'invisible-symphony-260615')
    const triune = timelineBanners.find((banner) => banner.id === 'triune-verdant-260615')
    const sylvan = timelineBanners.find((banner) => banner.id === 'sylvan-omen-260615')

    expect(skin).toMatchObject({
      category: 'skin',
      endDate: '2026-06-29T01:00:00.000Z',
      pricing: 'Free',
      startDate: '2026-06-15T01:00:00.000Z',
      title: 'Ouvertüre Universell',
    })
    expect(skin?.featured?.map((unit) => unit.name)).toEqual(['Hameln'])
    expect(skin?.artVariants?.detail).toContain('ouverture-universell-detail.webp')
    expect(rerunEvent).toMatchObject({
      category: 'gameplay-event',
      endDate: '2026-07-13T01:00:00.000Z',
      rerun: true,
      startDate: '2026-06-15T01:00:00.000Z',
      title: 'Invisible Symphony',
    })
    expect(rerunEvent?.featured?.map((unit) => unit.name)).toEqual([
      'Hameln',
      'Never-Ending Performance',
    ])
    expect(rerunEvent?.rewards?.slice(0, 2).map((group) => group.items[0])).toEqual([
      {name: 'Never-Ending Performance', amount: '×10'},
      {name: 'Never-Ending Performance', amount: '×6'},
    ])
    const pontos = timelineEvents.find((event) => event.id === 'ebwynnos-260629')
    expect(pontos?.featured).toContainEqual(
      expect.objectContaining({name: 'The Hollow One', kind: 'posse'}),
    )
    expect(pontos?.rewards?.slice(0, 4).map((group) => group.items[0])).toEqual([
      {name: 'The Errant Compass', amount: '×7'},
      {name: 'The Errant Compass', amount: '×3'},
      {name: 'The Errant Compass', amount: '×3'},
      {name: 'The Errant Compass', amount: '×3'},
    ])
    expect(triune?.featured?.map((unit) => unit.name)).toEqual(['Hameln', 'Murphy', 'Clementine'])
    expect(sylvan?.featured?.map((unit) => unit.name)).toEqual([
      'Eternal Requiem',
      'Shrouded Birth',
      'Veiled Anguish',
    ])
    expect([triune?.type, sylvan?.type]).toEqual(['rerun', 'rerun'])
  })

  it('loads the patch 2.6.1 banners and event cycles', () => {
    const ogier = timelineBanners.find((banner) => banner.id === 'ogier-duo-260921')
    const triune = timelineBanners.find((banner) => banner.id === 'triune-verdant-261005')
    const sylvan = timelineBanners.find((banner) => banner.id === 'sylvan-omen-261005')
    const gameplay = timelineEvents.find((event) => event.id === 'should-glory-fade-260921')
    const archives = timelineEvents.find((event) => event.id === 'born-in-darkness-260921')
    const preorder = timelineEvents.find((event) => event.id === 'sneaky-witch-261012')
    const rerun = timelineEvents.find((event) => event.id === 'mirrored-prisoner-261005')

    expect(ogier).toMatchObject({
      endDate: '2026-10-19T01:00:00.000Z',
      pinned: true,
      startDate: '2026-09-21T01:00:00.000Z',
      title: 'Sin-Bound Glory / Sullied White',
    })
    expect(ogier?.featured?.map((unit) => unit.name)).toEqual(['Ogier: Oathbound', 'Ever Sunward'])
    expect(triune?.featured?.map((unit) => unit.name)).toEqual(['Castor', 'Miryam', 'Xu'])
    expect(sylvan?.featured?.map((unit) => unit.name)).toEqual([
      'Unbearable Freedom',
      'Power of the Pious',
      'Vain Regrets',
    ])
    expect(gameplay).toMatchObject({
      category: 'gameplay-event',
      artVariants: {detail: expect.stringContaining('should-glory-fade-detail.webp')},
      title: 'Should Glory Fade',
    })
    expect(archives).toMatchObject({
      category: 'wheel-event',
      artVariants: {detail: expect.stringContaining('born-in-darkness-detail.webp')},
      pricing: '1680 Silver Prime',
      title: 'Born in Darkness',
    })
    expect(preorder).toMatchObject({
      category: 'preorder',
      artVariants: {detail: expect.stringContaining('witchs-nocturnal-operation-detail.webp')},
      endDate: '2026-11-16T01:00:00.000Z',
      pricing: '1980 Silver Prime',
      startDate: '2026-10-12T01:00:00.000Z',
    })
    expect(preorder?.featured).toBeUndefined()
    expect(rerun).toMatchObject({
      category: 'gameplay-event',
      rerun: true,
      title: 'Mirrored Prisoner',
    })
    expect(rerun?.rewards?.slice(0, 4).map((group) => group.items[0])).toEqual([
      {name: 'Lone Feather', amount: '×7'},
      {name: 'Lone Feather', amount: '×3'},
      {name: 'Lone Feather', amount: '×3'},
      {name: 'Lone Feather', amount: '×3'},
    ])
    const glory = timelineEvents.find((event) => event.id === 'should-glory-fade-260921')
    expect(glory?.rewards?.slice(0, 2).map((group) => group.items[0])).toEqual([
      {name: 'Shadowed by the Past', amount: '×10'},
      {name: 'Shadowed by the Past', amount: '×6'},
    ])
    expect(rerun?.featured?.at(-1)).toMatchObject({
      name: 'Derision of Destiny',
      kind: 'posse',
    })
  })
})
