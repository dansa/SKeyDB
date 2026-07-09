import type {PublicDescriptionArg} from './public-description-args.schema'

export interface PosseFullRecord {
  id: string
  name: string
  realm: string
  assetId: string
  assetCrystalId?: string
  assetBadgeId?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  descriptionTemplate: string
  descriptionArgs: Record<string, PublicDescriptionArg>
  lore?: string
  acquisitionSource?: string
}
