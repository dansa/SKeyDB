import {describe, expect, it} from 'vitest'

import rawBanners from '@/data/timeline/banners.json'

import {getBannerDailyScheduleEntry} from './timeline'
import {resolveTimelineBannerDerivedPool} from './timeline-banner-pools'
import {loadTimelineBanners, timelineBanners, timelineEvents} from './timeline-data'

describe('timeline data loading', () => {
  it('loads split event featured entries and opt-out detail links', () => {
    const splitEvent = timelineEvents.find(
      (event) => event.id === 'event-story-rerun-great-conquering',
    )
    const preorder = timelineEvents.find((event) => event.id === 'event-preorder-arachne')

    expect(splitEvent?.featured?.map((unit) => unit.name)).toEqual(['Agrippa', 'Uvhash'])
    expect(preorder?.featured?.[0]).toMatchObject({name: 'Arachne', detailLink: false})
  })

  it('loads anniversary and collab placeholder surfaces', () => {
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
    expect(meowch?.description).toContain('Entry closes June 15')
    expect(giftBoxes).toMatchObject({
      category: 'bundle',
      pricing: '688-2688 Silver Prime',
      title: 'New Arrivals Gift Boxes',
    })
    expect(giftBoxes?.description).toContain('1280 Silver Prime')
    expect(preorder).toMatchObject({
      category: 'preorder',
      pricing: '1980 Silver Prime',
      title: 'Pre-order "Unfading Memories"',
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
      customArt: expect.stringContaining('saya-collab-prelim'),
      endDate: '2026-08-24T01:00:00.000Z',
      pinned: true,
      startDate: '2026-05-30T01:00:00.000Z',
      tags: ['awaken', 'collab'],
      title: 'Sprout of Liebestod / Alien Crypsela',
      type: 'awaken',
    })
    expect(collabBanner?.featured).toBeUndefined()
    expect(anniversaryLogin?.customArt).toContain('to-the-star')
    expect(dreamyRendezvous?.customArt).toContain('dreamy-rendezvous')
    expect(collabEvent?.customArt).toContain('saya-event')
    expect(collabSideStory).toMatchObject({
      category: 'story',
      endDate: '2026-08-24T01:00:00.000Z',
      pricing: 'Free',
      startDate: '2026-05-30T01:00:00.000Z',
      title: 'Forgotten Seed of Love',
    })
    expect(collabSideStory?.customArt).toContain('forgotten-seed')
    expect(collabSideStory?.description).toContain('Permanent Multiverse Link side story')
    expect(collabBanner?.preliminary).toBeUndefined()
  })

  it('derives Stars in Full Bloom premium pools by limited SSR awakener type', () => {
    const assault = timelineBanners.find(
      (banner) => banner.id === 'banner-stars-in-full-bloom-assault',
    )
    const warden = timelineBanners.find(
      (banner) => banner.id === 'banner-stars-in-full-bloom-warden',
    )
    const chorus = timelineBanners.find(
      (banner) => banner.id === 'banner-stars-in-full-bloom-chorus',
    )

    expect([assault, warden, chorus].map((banner) => banner?.title)).toEqual([
      'Stars in Full Bloom',
      'Stars in Full Bloom',
      'Stars in Full Bloom',
    ])
    expect(assault).toMatchObject({
      customTags: ['Assault'],
      pricing: 'USD 29.99',
      type: 'premium',
    })
    expect(warden).toMatchObject({
      customTags: ['Warden'],
      pricing: 'USD 29.99',
      type: 'premium',
    })
    expect(chorus).toMatchObject({
      customTags: ['Chorus'],
      pricing: 'USD 29.99',
      type: 'premium',
    })

    expect(assault?.poolSlots?.[0]?.pool.map((unit) => unit.name)).toEqual([
      '24',
      'Daffodil',
      'Doresain',
      'Kathigu-Ra',
      'Mouchette',
      'Pollux',
      'Sorel',
      'Tulu',
      'Vortice',
    ])
    expect(assault?.poolSlots?.[2]?.pool.map((unit) => unit.name)).toEqual([
      'By Rose Alone',
      'Kiss of Repose',
      'Aberrant Devour',
      'Amber-Tinted Death',
      'Doomsday Rampage',
      'Treasured Rarity',
      'Twisted Knight Ballad',
      'Hymn of the Sovereign',
      'The Faraway Eden',
    ])
    expect(warden?.poolSlots?.[0]?.pool).toHaveLength(7)
    expect(warden?.poolSlots?.[2]?.pool).toHaveLength(8)
    expect(chorus?.poolSlots?.[0]?.pool).toHaveLength(11)
    expect(chorus?.poolSlots?.[2]?.pool).toHaveLength(11)
    expect(assault?.poolSlots).toHaveLength(4)
    expect(assault?.poolSlots?.[1]?.pool).toEqual(assault?.poolSlots?.[0]?.pool)
    expect(assault?.poolSlots?.[3]?.pool).toEqual(assault?.poolSlots?.[2]?.pool)
  })

  it('derives Kaleido Recollections pools from limited availability groups', () => {
    const faded = timelineBanners.find((banner) => banner.id === 'banner-moonless-guide')
    const astral = timelineBanners.find(
      (banner) => banner.id === 'banner-kaleido-recollections-astral-reign',
    )

    expect(faded?.poolSlots).toHaveLength(4)
    expect(faded?.poolSlots?.slice(0, 3).map((slot) => slot.pool.length)).toEqual([14, 14, 14])
    expect(faded?.poolSlots?.[3]?.pool).toHaveLength(15)
    expect(faded?.poolSlots?.[0]?.pool.map((unit) => unit.name)).toContain('Tulu')
    expect(faded?.poolSlots?.[3]?.pool.map((unit) => unit.name)).toContain('Hymn of the Sovereign')

    expect(astral?.poolSlots).toHaveLength(4)
    expect(astral?.poolSlots?.slice(0, 3).map((slot) => slot.pool.length)).toEqual([13, 13, 13])
    expect(astral?.poolSlots?.[3]?.pool).toHaveLength(13)
    expect(astral?.poolSlots?.[0]?.pool.map((unit) => unit.name)).toContain('Arachne')
    expect(astral?.poolSlots?.[3]?.pool.map((unit) => unit.name)).toContain('Eternal Weave')
  })

  it('loads Echoing Wishes as a daily limited awakener and wheel schedule', () => {
    const echoingWishes = timelineBanners.find((banner) => banner.id === 'banner-echoing-wishes')
    const rawEchoingWishes = rawBanners.find((banner) => banner.id === 'banner-echoing-wishes')

    expect(echoingWishes).toMatchObject({
      tags: undefined,
      type: 'daily',
    })
    expect(rawEchoingWishes?.derivedPool).toBeUndefined()
    expect(echoingWishes?.poolSlots).toBeUndefined()
    expect(echoingWishes?.dailySchedule).toHaveLength(28)
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
          awakeners: [
            {
              aliases: ['Wheel Owner'],
              availabilityType: 'LIMITED_TEST_POOL',
              faction: 'test',
              id: 'awakener-9001',
              lineupToken: 'wheel-owner',
              name: 'Wheel Owner',
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
    expect(rerunEvent?.featured?.map((unit) => unit.name)).toEqual(['Hameln'])
    expect(triune?.featured?.map((unit) => unit.name)).toEqual(['Hameln', 'Murphy', 'Clementine'])
    expect(sylvan?.featured?.map((unit) => unit.name)).toEqual([
      'Eternal Requiem',
      'Shrouded Birth',
      'Veiled Anguish',
    ])
    expect([triune?.type, sylvan?.type]).toEqual(['rerun', 'rerun'])
  })
})
