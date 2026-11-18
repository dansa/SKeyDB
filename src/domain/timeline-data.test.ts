import {describe, expect, it} from 'vitest'

import rawBanners from '@/data/timeline/banners.json'

import {getBannerDailyScheduleEntry} from './timeline'
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
    const event = timelineEvents.find(({id}) => id === 'event-constellated-memories')
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
    const stars = timelineEvents.find(({id}) => id === 'event-campaign-half-anniversary')
    expect(stars?.rewards?.[0]?.layout).toBe('days')
    expect(stars?.rewards?.[0]?.items).toEqual(
      Array.from({length: 16}, () => ({name: 'To the Stars', amount: '×1'})),
    )
    const rendezvous = timelineEvents.find(({id}) => id === 'event-dreamy-rendezvous')
    expect(rendezvous?.pricing).toBe('3980 Silver Prime')
    expect(rendezvous?.missions?.at(-1)).toMatchObject({
      standard: expect.arrayContaining([{name: 'Saya', amount: '×1'}]),
      premium: expect.arrayContaining([
        {name: 'Soul Rewind Core', amount: '×1'},
        {name: 'Fate Rewind Core', amount: '×1'},
      ]),
    })
    const meowch = timelineEvents.find(({id}) => id === 'event-meowch-obliged')
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
    ['24', 'Crimson Kaede', '980 Silver Prime', 9],
    ['wanda', 'With Spikenard and Myrrh', 'Free', 6],
    ['hameln', 'Ouvertüre Universell', 'Free', 6],
    ['rerun-candy-snatcher', 'Candy Snatcher', '480-1980 Silver Prime', 0],
  ])('loads verified skin rewards and art for %s', (id, skin, price, missions) => {
    const entry = timelineEvents.find(({id: eventId}) => eventId === `event-skin-${id}`)
    expect(entry?.pricing).toBe(price)
    expect(entry?.missions ?? []).toHaveLength(missions)
    expect(entry?.rewards?.flatMap(({items}) => items)).toContainEqual({name: skin, amount: '×1'})
    expect(entry?.artVariants).toEqual({
      card: expect.stringContaining('-card.webp'),
      detail: expect.stringContaining('-detail.webp'),
    })
    if (id === '24') {
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
      'event-preorder-arachne',
      'Conjugated Fates',
      '"Moirae Weaver" avatar',
      '2026-04-20',
      'May 17',
      null,
    ],
    [
      'event-preorder-unfading-memories',
      'Unfading Memories',
      '"Bon Appetite" avatar',
      '2026-05-30',
      'Jun 26',
      '2026-07-06',
    ],
    [
      'event-preorder-myriad-wishcraft',
      'Myriad Wishcraft',
      '"Trickery in Motion" avatar',
      '2026-08-24',
      'Sep 20',
      '2026-09-28',
    ],
    [
      'event-preorder-witchs-nocturnal-operation',
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
    ['event-wheel-ryker', 980, 25, 25],
    ['event-wheel-private-afternoon', 980, 25, 25],
    ['event-wheel-blossom-court', 980, 25, 25],
    ['event-wheel-dreaming-of-wonderland', 1680, 30, 60],
    ['event-wheel-falling-upward', 1680, 30, 60],
    ['event-wheel-soul-synchronization', 1680, 30, 60],
    ['event-wheel-darker-than-darkness', 1680, 30, 60],
    ['event-wheel-imagos-clinic', 1680, 30, 60],
    ['event-wheel-aquamarine-dream', 1680, 30, 60],
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
  it('resolves both bundled Curriculum artwork variants', () => {
    const event = timelineEvents.find(({id}) => id === 'event-curriculum-season-40')
    expect(event?.artVariants).toEqual({
      card: expect.stringContaining('curriculum-card.webp'),
      detail: expect.stringContaining('curriculum-detail.webp'),
    })
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
    const banner = timelineBanners.find((entry) => entry.id === 'banner-vivian')
    expect(banner?.featured).toEqual([
      expect.objectContaining({name: 'Vivian', realmId: 'CHAOS', detailLink: undefined}),
      expect.objectContaining({name: "The Seer's Riddle", detailLink: undefined}),
    ])

    const story = timelineEvents.find((entry) => entry.id === 'event-story-vivian')
    expect(story?.featured?.[0]).toMatchObject({
      name: 'Vivian',
      realmId: 'CHAOS',
      detailLink: undefined,
    })
    expect(story?.customArt).toContain('and-then-there-were-none')

    const clinic = timelineEvents.find((entry) => entry.id === 'event-wheel-imagos-clinic')
    expect(clinic?.featured?.[0]).toMatchObject({
      name: "Imago's Clinic",
      detailLink: undefined,
    })
    expect(clinic?.customArt).toContain('soul-anatomist')
    expect(
      timelineEvents.find((entry) => entry.id === 'event-story-rerun-dark-side-of-the-canvas')
        ?.customArt,
    ).toContain('dark-side-of-the-canvas')
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
    const splitEvent = timelineEvents.find(
      (event) => event.id === 'event-story-rerun-great-conquering',
    )
    const preorder = timelineEvents.find((event) => event.id === 'event-preorder-arachne')

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
    const anniversaryLogin = timelineEvents.find(
      (event) => event.id === 'event-campaign-half-anniversary',
    )
    const dreamyRendezvous = timelineEvents.find((event) => event.id === 'event-dreamy-rendezvous')
    const meowch = timelineEvents.find((event) => event.id === 'event-meowch-obliged')
    const giftBoxes = timelineEvents.find((event) => event.id === 'event-curated-gift-boxes')
    const preorder = timelineEvents.find((event) => event.id === 'event-preorder-unfading-memories')
    const season33Login = timelineEvents.find((event) => event.id === 'event-login-season-33')
    const season34Curriculum = timelineEvents.find(
      (event) => event.id === 'event-curriculum-season-34',
    )
    const collabEvent = timelineEvents.find((event) => event.id === 'event-story-saya')
    const collabSideStory = timelineEvents.find(
      (event) => event.id === 'event-story-forgotten-seed-of-love',
    )
    const collabBanner = timelineBanners.find((banner) => banner.id === 'banner-saya-no-uta-collab')

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
    expect(meowch?.description).toContain('New entries closed Jun 15')
    expect(meowch?.description).toContain('14 days after reaching that goal')
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
      title: 'Curriculum Honor',
    })
    expect(season34Curriculum?.description).toContain('doubled EXP')
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
    expect(anniversaryLogin?.customArt).toContain('to-the-star')
    expect(dreamyRendezvous?.customArt).toContain('dreamy-rendezvous')
    expect(collabEvent?.customArt).toContain('saya-event')
    expect(collabSideStory).toMatchObject({
      category: 'story',
      endDate: '2026-08-24T01:00:00.000Z',
      pricing: 'Free during event',
      startDate: '2026-05-30T01:00:00.000Z',
      title: 'Forgotten Seed of Love',
      featured: [{name: 'For the New World', kind: 'posse'}],
    })
    expect(collabSideStory?.customArt).toContain('forgotten-seed')
    expect(collabSideStory?.description).toContain('Permanent Multiverse Link side story')
    expect(collabBanner?.preliminary).toBeUndefined()
  })

  it('keeps anniversary milestone thresholds and rewards in order', () => {
    const dreamy = timelineEvents.find((event) => event.id === 'event-dreamy-offering')
    const stream = timelineEvents.find((event) => event.id === 'event-stream-of-infatuation')
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
    const lotanBanner = timelineBanners.find((banner) => banner.id === 'banner-lotan-cetarchon')
    const lotanEvent = timelineEvents.find((event) => event.id === 'event-story-lotan-cetarchon')
    const fallingUpwardEvent = timelineEvents.find(
      (event) => event.id === 'event-wheel-falling-upward',
    )

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
    const helot = timelineEvents.find((event) => event.id === 'event-story-rerun-helot-catena')
    expect(helot?.rewards?.slice(0, 2).map((group) => group.items[0])).toEqual([
      {name: 'Til the Snow Melts', amount: '×7'},
      {name: 'Til the Snow Melts', amount: '×9'},
    ])
    expect(fallingUpwardEvent?.featured).toMatchObject([
      {kind: 'wheel', name: 'Falling Upward', detailLink: undefined},
    ])
  })

  it('enables released Caraboo timeline details without prerelease realm overrides', () => {
    const carabooBanner = timelineBanners.find((banner) => banner.id === 'banner-caraboo')
    const carabooEvent = timelineEvents.find((event) => event.id === 'event-story-caraboo')
    const soulSynchronizationEvent = timelineEvents.find(
      (event) => event.id === 'event-wheel-soul-synchronization',
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
    const suns = timelineEvents.find(
      (event) => event.id === 'event-story-rerun-a-million-suns-descend',
    )
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
      const banner = timelineBanners.find(({id}) => id === `banner-stars-in-full-bloom-${role}`)
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
        .find(({id}) => id === 'banner-stars-in-full-bloom-assault')
        ?.poolSlots?.[0]?.pool.map(({name}) => name),
    ).toContain('Helot: Catena')
  })

  it('loads the May Kaleido SSR pools with their limited Genesis entries', () => {
    const faded = timelineBanners.find(({id}) => id === 'banner-moonless-guide')
    const astral = timelineBanners.find(
      ({id}) => id === 'banner-kaleido-recollections-astral-reign',
    )

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
    const echoingWishes = timelineBanners.find((banner) => banner.id === 'banner-echoing-wishes')
    const rawEchoingWishes = rawBanners.find((banner) => banner.id === 'banner-echoing-wishes')

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
    const banner = timelineBanners.find((entry) => entry.id === 'banner-stars-cradled-close')

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
      const banner = timelineBanners.find(({id}) => id === `banner-lightward-reminiscence-${role}`)
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
    const skin = timelineEvents.find((event) => event.id === 'event-skin-hameln')
    const rerunEvent = timelineEvents.find(
      (event) => event.id === 'event-story-rerun-invisible-symphony',
    )
    const triune = timelineBanners.find((banner) => banner.id === 'banner-triune-verdant-jun')
    const sylvan = timelineBanners.find((banner) => banner.id === 'banner-sylvan-omen-jun')

    expect(skin).toMatchObject({
      category: 'skin',
      endDate: '2026-06-29T01:00:00.000Z',
      pricing: 'Free',
      startDate: '2026-06-15T01:00:00.000Z',
      title: 'Ouvertüre Universell',
    })
    expect(skin?.featured?.map((unit) => unit.name)).toEqual(['Hameln'])
    expect(skin?.customArt).toContain('hameln-skin')
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
    const pontos = timelineEvents.find((event) => event.id === 'event-story-pontos')
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
    const ogier = timelineBanners.find((banner) => banner.id === 'banner-ogier-oathbound')
    const triune = timelineBanners.find((banner) => banner.id === 'banner-triune-verdant-oct')
    const sylvan = timelineBanners.find((banner) => banner.id === 'banner-sylvan-omen-oct')
    const gameplay = timelineEvents.find((event) => event.id === 'event-story-ogier-oathbound')
    const archives = timelineEvents.find((event) => event.id === 'event-wheel-darker-than-darkness')
    const preorder = timelineEvents.find(
      (event) => event.id === 'event-preorder-witchs-nocturnal-operation',
    )
    const rerun = timelineEvents.find((event) => event.id === 'event-story-rerun-mirrored-prisoner')

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
      customArt: expect.stringContaining('should-glory-fade'),
      title: 'Should Glory Fade',
    })
    expect(archives).toMatchObject({
      category: 'wheel-event',
      customArt: expect.stringContaining('born-in-darkness'),
      pricing: '1680 Silver Prime',
      title: 'Born in Darkness',
    })
    expect(preorder).toMatchObject({
      category: 'preorder',
      customArt: expect.stringContaining('witchs-nocturnal-operation'),
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
    const glory = timelineEvents.find((event) => event.id === 'event-story-ogier-oathbound')
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
