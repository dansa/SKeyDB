import { OwnedAssetBoxExport, type OwnedAssetBoxEntry } from './OwnedAssetBoxExport'

export type OwnedWheelBoxEntry = {
  id: string
  name: string
  rarity: 'SSR' | 'SR' | 'R'
  level: number
  wheelAsset: string | null
}

type OwnedWheelBoxExportProps = {
  entries: OwnedWheelBoxEntry[]
  onStatusMessage: (message: string) => void
}

const wheelRarityOptions = [
  { value: 'SSR', label: 'SSR' },
  { value: 'SR', label: 'SR' },
  { value: 'R', label: 'R' },
] as const

const defaultIncludedRarities: Record<(typeof wheelRarityOptions)[number]['value'], boolean> = {
  SSR: true,
  SR: false,
  R: false,
}

export function OwnedWheelBoxExport({ entries, onStatusMessage }: OwnedWheelBoxExportProps) {
  const normalizedEntries: OwnedAssetBoxEntry<(typeof wheelRarityOptions)[number]['value']>[] = entries.map(
    (entry) => ({
      id: entry.id,
      label: entry.name,
      level: entry.level,
      asset: entry.wheelAsset,
      rarity: entry.rarity,
    }),
  )

  return (
    <OwnedAssetBoxExport
      assetAltNoun="wheel"
      buttonLabel="Export wheels as PNG (owned only)"
      cardAspectClassName="aspect-[75/113]"
      defaultIncludedRarities={defaultIncludedRarities}
      entries={normalizedEntries}
      filenamePrefix="skeydb-wheel-box"
      imageClassName="h-full w-full object-cover object-center scale-[1.2]"
      modalTitle="Export Owned Wheel Box"
      nameToggleLabel="Wheel Names"
      onStatusMessage={onStatusMessage}
      placeholderClassName="sigil-placeholder-wheel"
      rarityOptions={wheelRarityOptions}
      storageKeyPrefix="skeydb.ownedWheelBoxExport"
    />
  )
}
