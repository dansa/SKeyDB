import type {
  AwakenerEnlightenRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'
import type {
  DatabaseDescribedEntry,
  ResolvedAwakenerDatabaseShellView,
} from '@/domain/awakeners-database-view'
import type {AwakenerFullV2Record} from '@/domain/awakeners-full-v2'
import type {DescribedRecord} from '@/domain/description-records'

export function makeTestFullStats(overrides: Partial<FullStats> = {}): FullStats {
  return {
    CON: '100',
    ATK: '100',
    DEF: '100',
    CritRate: '5%',
    CritDamage: '50%',
    AliemusRegen: '0',
    KeyflareRegen: '15',
    RealmMastery: '0',
    SigilYield: '0%',
    DamageAmplification: '0%',
    DeathResistance: '0%',
    ...overrides,
  }
}

export function makeTestAwakener(
  overrides: Partial<Omit<Awakener, 'id'>> & {id: string | number; name: string},
): Awakener {
  const numericId = typeof overrides.id === 'number' ? overrides.id : overrides.numericId
  return {
    realm: 'AEQUOR',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: [overrides.name],
    tags: [],
    lineupToken: 'a',
    ...overrides,
    id:
      typeof overrides.id === 'number'
        ? `awakener-${String(overrides.id).padStart(4, '0')}`
        : overrides.id,
    numericId,
  }
}

export function makeTestAwakenerFullV2Record(
  overrides: Partial<AwakenerFullV2Record> & Pick<AwakenerFullV2Record, 'id' | 'displayName'>,
): AwakenerFullV2Record {
  return {
    stats: makeTestFullStats(),
    primaryScalingBase: 30,
    statScaling: {
      CON: 1.5,
      ATK: 1.5,
      DEF: 1.5,
    },
    substatScaling: {},
    ...overrides,
  } as AwakenerFullV2Record
}

export function makeSkillRecord(
  overrides: Partial<AwakenerSkillRecord> &
    Pick<AwakenerSkillRecord, 'id' | 'kind' | 'displayName'>,
): AwakenerSkillRecord {
  return {
    cost: '1',
    descriptionTemplate: `${overrides.displayName} text`,
    descriptionArgs: {},
    cardKeywords: [],
    variants: [],
    ...overrides,
  } as AwakenerSkillRecord
}

export function makeTalentRecord(
  overrides: Partial<AwakenerTalentRecord> & Pick<AwakenerTalentRecord, 'id' | 'displayName'>,
): AwakenerTalentRecord {
  return {
    maxLevel: 1,
    descriptionTemplate: `${overrides.displayName} text`,
    descriptionArgs: {},
    cardKeywords: [],
    variants: [],
    ...overrides,
  } as AwakenerTalentRecord
}

export function makeEnlightenRecord(
  overrides: Partial<AwakenerEnlightenRecord> &
    Pick<AwakenerEnlightenRecord, 'id' | 'displayName' | 'slot'>,
): AwakenerEnlightenRecord {
  return {
    descriptionTemplate: `${overrides.displayName} text`,
    descriptionArgs: {},
    ...overrides,
  } as AwakenerEnlightenRecord
}

export function makeDerivedSkillRecord(
  overrides: Partial<DerivedSkillRecord> & Pick<DerivedSkillRecord, 'id' | 'displayName'>,
): DerivedSkillRecord {
  return {
    nodeKind: 'single',
    cost: '0',
    descriptionTemplate: `${overrides.displayName} text`,
    descriptionArgs: {},
    childDerivedSkillIds: [],
    cardKeywords: [],
    variants: [],
    ...overrides,
  } as DerivedSkillRecord
}

export function makeDatabaseDescribedEntry<TRecord extends DescribedRecord>(
  overrides: Partial<DatabaseDescribedEntry<TRecord>> &
    Pick<DatabaseDescribedEntry<TRecord>, 'key' | 'label' | 'record' | 'resolved'>,
): DatabaseDescribedEntry<TRecord> {
  return {
    descriptionRank: 1,
    descriptionMaxRank: 1,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
    ...overrides,
  }
}

export function makeDatabaseShellView(
  overrides: Partial<ResolvedAwakenerDatabaseShellView> = {},
): ResolvedAwakenerDatabaseShellView {
  return {
    selection: {
      soulforgeLevel: 0,
      selectedEnlightenSlot: null,
    },
    skillLevel: 1,
    stats: makeTestFullStats(),
    activeEnlightenIds: [],
    record: {} as ResolvedAwakenerDatabaseShellView['record'],
    resolvedRecord: {} as ResolvedAwakenerDatabaseShellView['resolvedRecord'],
    overlayOverridesById: {},
    overlayInfluenceBadgesById: {},
    commandCards: [],
    exalts: [],
    overExalt: null,
    talents: [],
    enlightens: [],
    derivedSkills: [],
    promotedExtras: [],
    ...overrides,
  }
}
