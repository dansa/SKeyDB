import {describe, expect, it, vi} from 'vitest'

import type {AwakenerOverlayRecord, AwakenerSkillRecord} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'

import {
  buildOverlayEntry,
  buildTrailEntry,
  needsLazyReferenceHydration,
  resolveLiveTrailEntry,
  resolveNavigationHandler,
  resolveOverlayReference,
  withInheritedReferenceLayerOverride,
} from './database-popover-controller-model'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import type {TrailEntry} from './popover-trail'

const TEST_SKILL_RECORD: AwakenerSkillRecord = {
  id: 'skill.test.strike',
  ownerAwakenerId: 999,
  kind: 'strike',
  displayName: 'Strike',
  descriptionTemplate: 'Strike text.',
  descriptionArgs: {},
  cardKeywords: [],
  variants: [],
}

const TEST_OVERLAY: AwakenerOverlayRecord = {
  id: 'overlay.test.counter',
  displayName: 'Counter',
  overlayType: 'mechanic',
  aliases: [],
  iconId: 'IconS_Buff_019',
  descriptionTemplate: 'Fallback counter text.',
  descriptionArgs: {},
}

function skillReference(overrides: Partial<DatabaseReferenceInfo> = {}): DatabaseReferenceInfo {
  return {
    kind: 'skill',
    id: TEST_SKILL_RECORD.id,
    name: TEST_SKILL_RECORD.displayName,
    label: 'Card · C2 · Cost 1',
    record: TEST_SKILL_RECORD,
    description: 'Strike text.',
    keywordFooterText: undefined,
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
    ...overrides,
  }
}

function overlayReference(overrides: Partial<DatabaseReferenceInfo> = {}): DatabaseReferenceInfo {
  return {
    kind: 'overlay',
    id: TEST_OVERLAY.id,
    name: TEST_OVERLAY.displayName,
    label: 'Mechanic',
    record: TEST_OVERLAY,
    description: 'Resolved counter text.',
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
    ...overrides,
  }
}

function referenceLayer(references: DatabaseReferenceInfo[]): ResolvedDatabaseReferenceLayer {
  return {
    cardNames: new Set<string>(),
    accessibleOverlays: [TEST_OVERLAY],
    referenceInfoByName: new Map(
      references.map((reference) => [reference.name.toLowerCase(), reference]),
    ),
    referenceInfoById: new Map(references.map((reference) => [reference.id, reference])),
    overlayByName: new Map([['counter', TEST_OVERLAY]]),
  }
}

describe('database popover controller model', () => {
  it('builds trail entries with stable reference keys and title navigation targets', () => {
    const entry = buildTrailEntry(skillReference(), 'E1')

    expect(entry).toMatchObject({
      key: 'skill:skill.test.strike',
      referenceId: 'skill.test.strike',
      name: 'Strike',
      navigationTarget: {kind: 'skills'},
      selectedEnlightenSlot: 'E1',
    })
  })

  it('limits lazy hydration to global reference kinds without descriptions', () => {
    expect(needsLazyReferenceHydration(skillReference({description: ''}))).toBe(true)
    expect(needsLazyReferenceHydration(skillReference())).toBe(false)
  })

  it('resolves overlays by id before display name and falls back to overlay metadata', () => {
    const namedOverlay = overlayReference({description: 'Name match text.'})
    const idOverlay = overlayReference({description: 'Id match text.', name: 'Renamed Counter'})
    const layer = referenceLayer([namedOverlay, idOverlay])

    expect(resolveOverlayReference(layer, TEST_OVERLAY)).toBe(idOverlay)
    expect(
      buildOverlayEntry({
        overlay: {...TEST_OVERLAY, displayName: 'Missing', id: 'overlay.missing'},
        referenceLayer: layer,
        selectedEnlightenSlot: null,
      }),
    ).toMatchObject({
      key: 'overlay:overlay.missing',
      description: 'Fallback counter text.',
      name: 'Missing',
    })
  })

  it('applies overlay rank context only when the opener supplies it', () => {
    const layer = referenceLayer([overlayReference()])

    expect(
      buildOverlayEntry({
        overlay: TEST_OVERLAY,
        referenceLayer: layer,
        selectedEnlightenSlot: null,
      }),
    ).toMatchObject({
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
    })

    expect(
      buildOverlayEntry({
        overlay: TEST_OVERLAY,
        rankContext: {descriptionRank: 6, descriptionMaxRank: 6},
        referenceLayer: layer,
        selectedEnlightenSlot: null,
      }),
    ).toMatchObject({
      descriptionRank: 6,
      descriptionMaxRank: 6,
    })
  })

  it('refreshes hydrated live entries only when both current and live descriptions exist', () => {
    const oldReference = skillReference({description: 'Old text.'})
    const liveReference = skillReference({description: 'Live text.'})
    const layer = referenceLayer([liveReference])
    const entry = buildTrailEntry(oldReference, null)

    expect(
      resolveLiveTrailEntry({
        entry,
        referenceLayer: layer,
        selectedEnlightenSlot: 'E2',
      }),
    ).toMatchObject({
      description: 'Live text.',
      selectedEnlightenSlot: 'E2',
    })

    expect(
      resolveLiveTrailEntry({
        entry: {...entry, description: ''},
        referenceLayer: layer,
        selectedEnlightenSlot: 'E2',
      }),
    ).toMatchObject({description: ''})
  })

  it('maps navigation targets to close-then-navigate callbacks', () => {
    const clearTrail = vi.fn()
    const onNavigateToWheelPage = vi.fn()

    resolveNavigationHandler({
      activeEntryId: 'B01',
      handlers: {onNavigateToWheelPage},
      navigationTarget: {kind: 'wheel-page', wheelName: 'Merciful Nurturing'},
    })?.(clearTrail)

    expect(clearTrail).toHaveBeenCalledOnce()
    expect(onNavigateToWheelPage).toHaveBeenCalledWith({
      id: 'B01',
      name: 'Merciful Nurturing',
    })
  })

  it('preserves explicit entry overrides before inheriting source overrides', () => {
    const sourceLayer = referenceLayer([skillReference()])
    const explicitLayer = referenceLayer([overlayReference()])
    const sourceEntry: TrailEntry = {
      ...buildTrailEntry(skillReference(), null, sourceLayer),
      referenceLayerOverride: sourceLayer,
    }
    const nestedEntry: KeyedDatabaseReferenceEntry = {
      key: 'info.test',
      name: 'Info',
      label: 'Guide',
      description: 'Info text.',
      referenceLayerOverride: explicitLayer,
    }

    expect(
      withInheritedReferenceLayerOverride(nestedEntry, sourceEntry).referenceLayerOverride,
    ).toBe(explicitLayer)
    expect(
      withInheritedReferenceLayerOverride(
        {...nestedEntry, referenceLayerOverride: undefined},
        sourceEntry,
      ).referenceLayerOverride,
    ).toBe(sourceLayer)
  })
})
