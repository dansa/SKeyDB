import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerRosterRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'
import type {PublicV3UpgradeEntry} from './public-v3-awakener-record-adapters'

export type PublicRecordUpgrade = PublicV3UpgradeEntry

export interface AwakenerProfileStorySection {
  kind: 'introduction' | 'story'
  title: string
  unlockCondition?: string
  content: string
}

export interface AwakenerProfile {
  title?: string
  birthday?: string
  gender?: string
  height?: string
  weight?: string
  gnosticIndex?: string
  faction?: string
  storySections?: AwakenerProfileStorySection[]
}

export type PublicUpgradeableSkillRecord = AwakenerSkillRecord & {
  upgrades?: PublicRecordUpgrade[]
}

export type PublicUpgradeableDerivedSkillRecord = DerivedSkillRecord & {
  upgrades?: PublicRecordUpgrade[]
}

export type PublicUpgradeableOverlayRecord = AwakenerOverlayRecord & {
  upgrades?: PublicRecordUpgrade[]
}

export interface AwakenerFullRecord extends AwakenerRosterRecord {
  profile?: AwakenerProfile
  cards: {
    C1: PublicUpgradeableSkillRecord
    C2: PublicUpgradeableSkillRecord
    C3: PublicUpgradeableSkillRecord
    C4: PublicUpgradeableSkillRecord
    C5: PublicUpgradeableSkillRecord
    Exalt: PublicUpgradeableSkillRecord
    OverExalt?: PublicUpgradeableSkillRecord
    promotedExtras: PublicUpgradeableDerivedSkillRecord[]
  }
  talents: {
    T1?: AwakenerTalentRecord
    T2?: AwakenerTalentRecord
    T3?: AwakenerTalentRecord
    T4?: AwakenerTalentRecord
    orderedTalents?: AwakenerTalentRecord[]
    extraTalents: AwakenerTalentRecord[]
  }
  enlightens: {
    E1: AwakenerEnlightenRecord
    E2: AwakenerEnlightenRecord
    E3: AwakenerEnlightenRecord
    OverExalt?: AwakenerEnlightenRecord
    AbsoluteAxiom?: AwakenerEnlightenRecord
  }
  derivedSkills: PublicUpgradeableDerivedSkillRecord[]
  overlays?: PublicUpgradeableOverlayRecord[]
}

export function getAwakenerFullById(
  awakenerId: number,
  records: AwakenerFullRecord[],
): AwakenerFullRecord | undefined {
  return records.find((entry) => entry.id === awakenerId)
}
