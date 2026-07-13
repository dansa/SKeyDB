import type {PublicDescriptionArg} from './public-description-args.schema'

export interface CovenantSetEffectRecord {
  set: number
  descriptionTemplate: string
  descriptionArgs: Record<string, PublicDescriptionArg>
}

export interface CovenantFullRecord {
  id: string
  name: string
  assetId: string
  setEffects: CovenantSetEffectRecord[]
  lore?: string
  acquisitionSource?: string
}
