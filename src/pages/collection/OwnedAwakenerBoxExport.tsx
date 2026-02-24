import { OwnedAssetBoxExport, type OwnedAssetBoxEntry } from './OwnedAssetBoxExport'

export type OwnedAwakenerBoxEntry = {
  name: string
  displayName: string
  level: number
  awakenerLevel: number
  cardAsset: string | null
}

type OwnedAwakenerBoxExportProps = {
  entries: OwnedAwakenerBoxEntry[]
  onStatusMessage: (message: string) => void
}

export function OwnedAwakenerBoxExport({ entries, onStatusMessage }: OwnedAwakenerBoxExportProps) {
  const normalizedEntries: OwnedAssetBoxEntry[] = entries.map((entry) => ({
    id: entry.name,
    label: entry.displayName,
    level: entry.level,
    cardLevel: entry.awakenerLevel,
    asset: entry.cardAsset,
  }))

  return (
    <OwnedAssetBoxExport
      assetAltNoun="card"
      buttonLabel="Export box as PNG (owned only)"
      cardAspectClassName="aspect-[2/3]"
      entries={normalizedEntries}
      filenamePrefix="skeydb-box"
      imageClassName="h-full w-full object-cover object-top scale-110"
      modalTitle="Export Owned Box"
      nameToggleLabel="Character Names"
      onStatusMessage={onStatusMessage}
      placeholderClassName="sigil-placeholder-card"
      storageKeyPrefix="skeydb.ownedBoxExport"
    />
  )
}
