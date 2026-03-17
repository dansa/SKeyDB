import {useEffect, useMemo, useRef, useState} from 'react'

import {FaImage} from 'react-icons/fa6'

import {Button} from '@/components/ui/Button'
import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'
import {ModalFrame} from '@/components/ui/ModalFrame'
import {TogglePill} from '@/components/ui/TogglePill'
import {
  compareAwakenersForCollectionSort,
  compareWheelsForCollectionDefaultSort,
  type AwakenerSortKey,
  type SortableCollectionEntry,
} from '@/domain/collection-sorting'
import {getBrowserLocalStorage, safeStorageWrite, type StorageLike} from '@/domain/storage'

import {
  clamp,
  DEFAULT_EXPORT_BOX_CONFIG,
  DEFAULT_EXPORT_SORT_CONFIG,
  DEFAULT_EXPORT_VISUAL_CONFIG,
  getExportLayoutWidth,
  loadStoredIncludedRarities,
  loadStoredLayoutConfig,
  loadStoredSortConfig,
  loadStoredVisualConfig,
  sanitizeConfig,
  type ExportBoxConfig,
  type ExportSortConfig,
  type ExportVisualConfig,
  type OwnedAssetBoxEntry,
  type RarityOption,
} from './export-config'
import {exportOwnedAssetBoxPreview} from './export-rendering'

export type {OwnedAssetBoxEntry} from './export-config'

type ExportSortBehavior = 'CONFIGURABLE' | 'WHEEL_DEFAULT'

interface OwnedAssetBoxExportProps<R extends string = never> {
  entries: OwnedAssetBoxEntry<R>[]
  onStatusMessage: (message: string) => void
  storageKeyPrefix: string
  buttonLabel: string
  modalTitle: string
  filenamePrefix: string
  nameToggleLabel: string
  assetAltNoun: string
  cardAspectClassName: string
  imageClassName: string
  placeholderClassName: string
  rarityOptions?: readonly RarityOption<R>[]
  defaultIncludedRarities?: Record<R, boolean>
  sortBehavior?: ExportSortBehavior
  sortOptions?: readonly AwakenerSortKey[]
}

function getInitialIncludedRarities<R extends string>(
  storage: StorageLike | null,
  storageKeyPrefix: string,
  rarityOptions: readonly RarityOption<R>[] | undefined,
  defaultIncludedRarities: Record<R, boolean> | undefined,
): Record<R, boolean> | null {
  if (!rarityOptions || !defaultIncludedRarities) {
    return null
  }

  return loadStoredIncludedRarities(storage, storageKeyPrefix, defaultIncludedRarities)
}

function pickRandomEmojiAsset(): string | null {
  if (emojiAssets.length === 0) {
    return null
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const randomValues = new Uint32Array(1)
    crypto.getRandomValues(randomValues)
    return emojiAssets[randomValues[0] % emojiAssets.length]
  }

  return emojiAssets[0]
}

function resolveActiveSortKey(
  sortOptions: readonly AwakenerSortKey[],
  sortKey: AwakenerSortKey,
): AwakenerSortKey {
  return sortOptions.includes(sortKey) ? sortKey : (sortOptions[0] ?? 'LEVEL')
}

function toSortableCollectionEntry<R extends string>(
  entry: OwnedAssetBoxEntry<R>,
): SortableCollectionEntry {
  return {
    label: entry.label,
    index: entry.sortIndex ?? Number.MAX_SAFE_INTEGER,
    enlighten: entry.level,
    level: entry.cardLevel ?? 0,
    rarity: entry.rarity,
    realm: entry.realm,
  }
}

function getExportUnavailableReason(
  hasAtLeastOneRarity: boolean,
  sortedEntryCount: number,
): string | null {
  if (!hasAtLeastOneRarity) {
    return 'Enable at least one rarity to export.'
  }

  if (sortedEntryCount === 0) {
    return 'Nothing matches the current filters.'
  }

  return null
}

const emojiAssets = Object.values(
  import.meta.glob<string>('../../assets/emoji/*.webp', {
    eager: true,
    import: 'default',
  }),
)

interface ExportSliderFieldProps {
  label: string
  min: number
  max: number
  step?: number
  value: number
  valueSuffix?: string
  onChange: (value: number) => void
}

function ExportSliderField({
  label,
  min,
  max,
  step = 1,
  value,
  valueSuffix,
  onChange,
}: ExportSliderFieldProps) {
  const displayValue = valueSuffix ? `${String(value)}${valueSuffix}` : String(value)

  return (
    <label className='grid gap-1.5'>
      <span className='flex items-center justify-between gap-2 tracking-wide text-slate-400 uppercase'>
        <span>{label}</span>
        <span className='rounded border border-slate-500/55 bg-slate-950/80 px-1.5 py-0.5 font-mono text-[11px] tracking-normal text-slate-200 normal-case'>
          {displayValue}
        </span>
      </span>
      <input
        className='export-box-slider'
        max={max}
        min={min}
        onChange={(event) => {
          onChange(Number(event.target.value))
        }}
        step={step}
        type='range'
        value={value}
      />
    </label>
  )
}

interface ExportPreviewProps<R extends string> {
  config: ExportBoxConfig
  visuals: ExportVisualConfig
  emojiAsset: string | null
  entries: OwnedAssetBoxEntry<R>[]
  assetAltNoun: string
  cardAspectClassName: string
  imageClassName: string
  placeholderClassName: string
  previewRef?: React.RefObject<HTMLDivElement | null>
}

function ExportPreview<R extends string>({
  config,
  visuals,
  emojiAsset,
  entries,
  assetAltNoun,
  cardAspectClassName,
  imageClassName,
  placeholderClassName,
  previewRef,
}: ExportPreviewProps<R>) {
  const exportLayoutWidth = getExportLayoutWidth(config)
  const titleSizePx = Math.round(clamp(config.cardWidthPx * 0.2, 14, 34))
  const titleEmojiSizePx = Math.round(clamp(titleSizePx * 2, 28, 64))
  const nameSizePx = Math.round(clamp(config.cardWidthPx * 0.125, 9, 16))
  const levelScaleMultiplier = config.levelTextScalePct / 100
  const levelSizePx = Math.round(clamp(config.cardWidthPx * 0.155, 10, 24) * levelScaleMultiplier)
  const levelPrefixSizePx = Math.round(clamp(levelSizePx * 0.72, 8, 18))
  const stackGapPx = Math.round(clamp(config.cardWidthPx * 0.025, 1, 4))

  return (
    <div
      className='bg-[#040a16] text-slate-100'
      ref={previewRef}
      style={{
        width: `${String(exportLayoutWidth)}px`,
        paddingLeft: `${String(config.outerPaddingXPx)}px`,
        paddingRight: `${String(config.outerPaddingXPx)}px`,
        paddingTop: `${String(config.outerPaddingYPx)}px`,
        paddingBottom: `${String(config.outerPaddingYPx)}px`,
      }}
    >
      <header className='mb-1 p-1'>
        <div className='flex items-center gap-2'>
          <p
            className='ui-title tracking-wide text-amber-100'
            style={{fontSize: `${String(titleSizePx)}px`}}
          >
            Made with SkeyDB
          </p>
          {!visuals.disableEmoji && emojiAsset ? (
            <img
              alt=''
              aria-hidden
              className='object-scale-down'
              src={emojiAsset}
              style={{
                height: `${String(titleEmojiSizePx)}px`,
                width: `${String(titleEmojiSizePx)}px`,
              }}
            />
          ) : null}
        </div>
      </header>
      <div
        className='grid justify-center'
        style={{
          gap: `${String(config.cardGapPx)}px`,
          gridTemplateColumns: `repeat(${String(config.columns)}, ${String(config.cardWidthPx)}px)`,
        }}
      >
        {entries.map((entry) => (
          <article className='border border-slate-500/45 bg-slate-900/65 p-1' key={entry.id}>
            <div
              className={`relative overflow-hidden border border-slate-400/35 bg-slate-900 ${cardAspectClassName}`}
            >
              {entry.asset ? (
                <img
                  alt={`${entry.label} ${assetAltNoun}`}
                  className={imageClassName}
                  src={entry.asset}
                />
              ) : (
                <span className={`sigil-placeholder ${placeholderClassName}`} />
              )}
              {!visuals.disableNames && visuals.nameOnTop ? (
                <p
                  data-testid='export-preview-card-label'
                  className='absolute top-1 right-1 left-1 z-11 truncate bg-slate-950/75 px-1 py-1 text-center leading-none text-slate-100'
                  style={{
                    fontSize: `${String(nameSizePx)}px`,
                    textShadow: '0 1px 2px rgba(2, 6, 12, 0.9)',
                  }}
                >
                  {entry.label}
                </p>
              ) : null}
              {(() => {
                const hasBottomLevel = visuals.showLevels && typeof entry.cardLevel === 'number'
                const hasBottomDupe = visuals.enlightensOnCard
                const hasBottomName = !visuals.disableNames && !visuals.nameOnTop
                if (!hasBottomLevel && !hasBottomDupe && !hasBottomName) {
                  return null
                }

                return (
                  <div
                    className='pointer-events-none absolute right-1 bottom-1 left-1 z-11 flex flex-col items-center'
                    style={{gap: `${String(stackGapPx)}px`}}
                  >
                    {hasBottomLevel ? (
                      <p
                        className='ui-title w-full text-left leading-none text-slate-100'
                        style={{
                          fontSize: `${String(levelSizePx)}px`,
                          textShadow: '0 1px 2px rgba(2, 6, 12, 0.9), 0 0 6px rgba(2, 6, 12, 0.65)',
                        }}
                      >
                        <span style={{fontSize: `${String(levelPrefixSizePx)}px`}}>Lv.</span>
                        <span>{entry.cardLevel}</span>
                      </p>
                    ) : null}
                    {hasBottomDupe ? (
                      <div className='flex w-full justify-center'>
                        <DupeLevelDisplay
                          className='inline-flex items-center justify-center text-[rgba(244,234,196,0.96)]'
                          level={entry.level}
                        />
                      </div>
                    ) : null}
                    {hasBottomName ? (
                      <p
                        data-testid='export-preview-card-label'
                        className='w-full truncate bg-slate-950/75 px-1 py-1 text-center leading-none text-slate-100'
                        style={{
                          fontSize: `${String(nameSizePx)}px`,
                          textShadow: '0 1px 2px rgba(2, 6, 12, 0.9)',
                        }}
                      >
                        {entry.label}
                      </p>
                    ) : null}
                  </div>
                )
              })()}
            </div>
            {!visuals.enlightensOnCard ? (
              <div className='mt-1 flex justify-center'>
                <DupeLevelDisplay
                  className='inline-flex items-center justify-center text-[rgba(244,234,196,0.96)]'
                  level={entry.level}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

interface OwnedAssetBoxExportModalProps<R extends string> {
  modalTitle: string
  rarityOptions?: readonly RarityOption<R>[]
  includedRarities: Record<R, boolean> | null
  handleRarityToggle: (rarity: R, checked: boolean) => void
  sortedEntries: OwnedAssetBoxEntry<R>[]
  hasSortControls: boolean
  sortConfig: ExportSortConfig
  onSortConfigChange: (updater: (current: ExportSortConfig) => ExportSortConfig) => void
  supportsRealmGrouping: boolean
  activeSortKey: AwakenerSortKey
  sortOptions: readonly AwakenerSortKey[]
  nameToggleLabel: string
  areNamesEnabled: boolean
  visuals: ExportVisualConfig
  onVisualsChange: (updater: (current: ExportVisualConfig) => ExportVisualConfig) => void
  supportsLevels: boolean
  draftConfig: ExportBoxConfig
  sanitizedDraftConfig: ExportBoxConfig
  onDraftConfigChange: (updater: (current: ExportBoxConfig) => ExportBoxConfig) => void
  assetAltNoun: string
  cardAspectClassName: string
  emojiAsset: string | null
  imageClassName: string
  placeholderClassName: string
  previewRef: React.RefObject<HTMLDivElement | null>
  exportUnavailableReason: string | null
  onReset: () => void
  onClose: () => void
  onExport: () => void
  isExporting: boolean
}

interface OwnedAssetBoxVisualSettingsProps {
  nameToggleLabel: string
  areNamesEnabled: boolean
  visuals: ExportVisualConfig
  onVisualsChange: (updater: (current: ExportVisualConfig) => ExportVisualConfig) => void
  supportsLevels: boolean
}

function OwnedAssetBoxVisualSettings({
  nameToggleLabel,
  areNamesEnabled,
  visuals,
  onVisualsChange,
  supportsLevels,
}: OwnedAssetBoxVisualSettingsProps) {
  const isEmojiInTitleEnabled = !visuals.disableEmoji

  return (
    <div className='space-y-2 border border-slate-700/60 bg-slate-950/50 p-2'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-[11px] tracking-wide text-slate-300 uppercase'>
          {nameToggleLabel}
        </span>
        <TogglePill
          ariaLabel={
            areNamesEnabled
              ? `Disable ${nameToggleLabel.toLowerCase()}`
              : `Enable ${nameToggleLabel.toLowerCase()}`
          }
          checked={areNamesEnabled}
          className='ownership-pill-builder'
          offLabel='Off'
          onChange={(namesEnabled) => {
            onVisualsChange((current) => ({
              ...current,
              disableNames: !namesEnabled,
            }))
          }}
          onLabel='On'
          variant='flat'
        />
      </div>
      {areNamesEnabled ? (
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[11px] tracking-wide text-slate-300 uppercase'>Name On Top</span>
          <TogglePill
            ariaLabel={visuals.nameOnTop ? 'Set names to bottom' : 'Set names to top'}
            checked={visuals.nameOnTop}
            className='ownership-pill-builder'
            offLabel='Off'
            onChange={(nameOnTop) => {
              onVisualsChange((current) => ({
                ...current,
                nameOnTop,
              }))
            }}
            onLabel='On'
            variant='flat'
          />
        </div>
      ) : null}
      {supportsLevels ? (
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[11px] tracking-wide text-slate-300 uppercase'>Show Levels</span>
          <TogglePill
            ariaLabel={visuals.showLevels ? 'Hide levels on card' : 'Show levels on card'}
            checked={visuals.showLevels}
            className='ownership-pill-builder'
            offLabel='Off'
            onChange={(showLevels) => {
              onVisualsChange((current) => ({
                ...current,
                showLevels,
              }))
            }}
            onLabel='On'
            variant='flat'
          />
        </div>
      ) : null}
      <div className='flex items-center justify-between gap-2'>
        <span className='text-[11px] tracking-wide text-slate-300 uppercase'>
          Enlightens On Card
        </span>
        <TogglePill
          ariaLabel={
            visuals.enlightensOnCard ? 'Move enlightens below card' : 'Move enlightens onto card'
          }
          checked={visuals.enlightensOnCard}
          className='ownership-pill-builder'
          offLabel='Off'
          onChange={(enlightensOnCard) => {
            onVisualsChange((current) => ({
              ...current,
              enlightensOnCard,
            }))
          }}
          onLabel='On'
          variant='flat'
        />
      </div>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-[11px] tracking-wide text-slate-300 uppercase'>Emoji In Title</span>
        <TogglePill
          ariaLabel={isEmojiInTitleEnabled ? 'Disable emoji in title' : 'Enable emoji in title'}
          checked={isEmojiInTitleEnabled}
          className='ownership-pill-builder'
          offLabel='Off'
          onChange={(emojiInTitleEnabled) => {
            onVisualsChange((current) => ({
              ...current,
              disableEmoji: !emojiInTitleEnabled,
            }))
          }}
          onLabel='On'
          variant='flat'
        />
      </div>
    </div>
  )
}

function OwnedAssetBoxExportModal<R extends string>({
  modalTitle,
  rarityOptions,
  includedRarities,
  handleRarityToggle,
  sortedEntries,
  hasSortControls,
  sortConfig,
  onSortConfigChange,
  supportsRealmGrouping,
  activeSortKey,
  sortOptions,
  nameToggleLabel,
  areNamesEnabled,
  visuals,
  onVisualsChange,
  supportsLevels,
  draftConfig,
  sanitizedDraftConfig,
  onDraftConfigChange,
  assetAltNoun,
  cardAspectClassName,
  emojiAsset,
  imageClassName,
  placeholderClassName,
  previewRef,
  exportUnavailableReason,
  onReset,
  onClose,
  onExport,
  isExporting,
}: OwnedAssetBoxExportModalProps<R>) {
  return (
    <ModalFrame
      panelClassName='flex h-[88vh] w-full max-w-[92vw] flex-col border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]'
      title={modalTitle}
    >
      <div className='mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_1fr]'>
        <div className='collection-scrollbar space-y-2 overflow-auto border border-slate-500/45 bg-slate-900/50 p-3 text-xs text-slate-300'>
          {rarityOptions && includedRarities ? (
            <div className='space-y-2 border border-slate-700/60 bg-slate-950/50 p-2'>
              <p className='text-[11px] tracking-wide text-slate-300 uppercase'>Rarities</p>
              {rarityOptions.map((option) => (
                <div className='flex items-center justify-between gap-2' key={option.value}>
                  <span className='text-[11px] tracking-wide text-slate-300 uppercase'>
                    {option.label}
                  </span>
                  <TogglePill
                    ariaLabel={`Include ${option.label} wheels`}
                    checked={includedRarities[option.value]}
                    className='ownership-pill-builder'
                    offLabel='Off'
                    onChange={(checked) => {
                      handleRarityToggle(option.value, checked)
                    }}
                    onLabel='On'
                    variant='flat'
                  />
                </div>
              ))}
              <p className='text-[11px] text-slate-400'>Included: {sortedEntries.length}</p>
            </div>
          ) : null}

          {hasSortControls ? (
            <div className='space-y-2 border border-slate-700/60 bg-slate-950/50 p-2'>
              <CollectionSortControls
                groupByRealm={sortConfig.groupByRealm}
                groupByRealmAriaLabel='Group by realm'
                headingText='Sort By'
                onGroupByRealmChange={(checked) => {
                  onSortConfigChange((current) => ({
                    ...current,
                    groupByRealm: checked,
                  }))
                }}
                onSortDirectionToggle={() => {
                  onSortConfigChange((current) => ({
                    ...current,
                    direction: current.direction === 'DESC' ? 'ASC' : 'DESC',
                  }))
                }}
                onSortKeyChange={(nextKey) => {
                  onSortConfigChange((current) => ({
                    ...current,
                    key: nextKey,
                  }))
                }}
                showGroupByRealm={supportsRealmGrouping}
                sortDirection={sortConfig.direction}
                sortKey={activeSortKey}
                sortOptions={sortOptions}
              />
            </div>
          ) : null}

          <OwnedAssetBoxVisualSettings
            areNamesEnabled={areNamesEnabled}
            nameToggleLabel={nameToggleLabel}
            onVisualsChange={onVisualsChange}
            supportsLevels={supportsLevels}
            visuals={visuals}
          />

          <ExportSliderField
            label='Columns'
            max={10}
            min={4}
            onChange={(columns) => {
              onDraftConfigChange((current) => ({
                ...current,
                columns,
              }))
            }}
            value={draftConfig.columns}
          />
          <ExportSliderField
            label='Card Width'
            max={150}
            min={52}
            onChange={(cardWidthPx) => {
              onDraftConfigChange((current) => ({
                ...current,
                cardWidthPx,
              }))
            }}
            value={draftConfig.cardWidthPx}
            valueSuffix='px'
          />
          <ExportSliderField
            label='Card Gap'
            max={16}
            min={2}
            onChange={(cardGapPx) => {
              onDraftConfigChange((current) => ({
                ...current,
                cardGapPx,
              }))
            }}
            value={draftConfig.cardGapPx}
            valueSuffix='px'
          />
          {supportsLevels ? (
            <ExportSliderField
              label='Level Text Scale'
              max={200}
              min={60}
              onChange={(levelTextScalePct) => {
                onDraftConfigChange((current) => ({
                  ...current,
                  levelTextScalePct,
                }))
              }}
              step={5}
              value={draftConfig.levelTextScalePct}
              valueSuffix='%'
            />
          ) : null}
          <ExportSliderField
            label='Left/Right Padding'
            max={32}
            min={0}
            onChange={(outerPaddingXPx) => {
              onDraftConfigChange((current) => ({
                ...current,
                outerPaddingXPx,
              }))
            }}
            value={draftConfig.outerPaddingXPx}
            valueSuffix='px'
          />
          <ExportSliderField
            label='Top/Bottom Padding'
            max={24}
            min={0}
            onChange={(outerPaddingYPx) => {
              onDraftConfigChange((current) => ({
                ...current,
                outerPaddingYPx,
              }))
            }}
            value={draftConfig.outerPaddingYPx}
            valueSuffix='px'
          />
          <ExportSliderField
            label='Pixel Ratio'
            max={2}
            min={0.5}
            onChange={(pixelRatio) => {
              onDraftConfigChange((current) => ({
                ...current,
                pixelRatio,
              }))
            }}
            step={0.1}
            value={draftConfig.pixelRatio}
          />
          <p className='text-[11px] text-slate-400'>
            Pixel ratio controls render density. Higher values look sharper, but increase file size
            quite a bit.
          </p>
          <div className='pt-1 text-[11px] text-slate-400'>
            Width: {getExportLayoutWidth(sanitizedDraftConfig)} px
          </div>
        </div>

        <div className='collection-scrollbar min-h-0 overflow-auto border border-slate-500/45 bg-slate-900/45 p-2'>
          <ExportPreview
            assetAltNoun={assetAltNoun}
            cardAspectClassName={cardAspectClassName}
            config={sanitizedDraftConfig}
            emojiAsset={emojiAsset}
            entries={sortedEntries}
            imageClassName={imageClassName}
            placeholderClassName={placeholderClassName}
            previewRef={previewRef}
            visuals={visuals}
          />
        </div>
      </div>

      <div className='mt-3 flex justify-end gap-2'>
        {exportUnavailableReason ? (
          <p className='mr-auto self-center text-[11px] text-slate-400'>
            {exportUnavailableReason}
          </p>
        ) : null}
        <Button onClick={onReset} type='button' variant='secondary'>
          Reset
        </Button>
        <Button onClick={onClose} type='button' variant='secondary'>
          Close
        </Button>
        <Button
          aria-disabled={isExporting}
          className={isExporting ? 'opacity-50' : undefined}
          onClick={onExport}
          type='button'
          variant='primary'
        >
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </Button>
      </div>
    </ModalFrame>
  )
}

export function OwnedAssetBoxExport<R extends string>({
  entries,
  onStatusMessage,
  storageKeyPrefix,
  buttonLabel,
  modalTitle,
  filenamePrefix,
  nameToggleLabel,
  assetAltNoun,
  cardAspectClassName,
  imageClassName,
  placeholderClassName,
  rarityOptions,
  defaultIncludedRarities,
  sortBehavior = 'CONFIGURABLE',
  sortOptions = ['LEVEL', 'ENLIGHTEN', 'ALPHABETICAL'],
}: OwnedAssetBoxExportProps<R>) {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [draftConfig, setDraftConfig] = useState<ExportBoxConfig>(() =>
    loadStoredLayoutConfig(storage, storageKeyPrefix),
  )
  const [visuals, setVisuals] = useState<ExportVisualConfig>(() =>
    loadStoredVisualConfig(storage, storageKeyPrefix),
  )
  const [sortConfig, setSortConfig] = useState<ExportSortConfig>(() =>
    loadStoredSortConfig(storage, storageKeyPrefix),
  )
  const [includedRarities, setIncludedRarities] = useState<Record<R, boolean> | null>(() =>
    getInitialIncludedRarities(storage, storageKeyPrefix, rarityOptions, defaultIncludedRarities),
  )
  const [emojiAsset, setEmojiAsset] = useState<string | null>(() => pickRandomEmojiAsset())
  const previewRef = useRef<HTMLDivElement | null>(null)

  const sanitizedDraftConfig = useMemo(() => sanitizeConfig(draftConfig), [draftConfig])
  const areNamesEnabled = !visuals.disableNames
  const supportsLevels = useMemo(
    () => entries.some((entry) => typeof entry.cardLevel === 'number'),
    [entries],
  )
  const filteredEntries = useMemo(() => {
    if (!includedRarities) {
      return entries
    }
    return entries.filter((entry) => (entry.rarity ? includedRarities[entry.rarity] : true))
  }, [entries, includedRarities])
  const activeSortKey = resolveActiveSortKey(sortOptions, sortConfig.key)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((left, right) => {
      const leftSortable = toSortableCollectionEntry(left)
      const rightSortable = toSortableCollectionEntry(right)

      if (sortBehavior === 'WHEEL_DEFAULT') {
        return compareWheelsForCollectionDefaultSort(leftSortable, rightSortable)
      }

      return compareAwakenersForCollectionSort(leftSortable, rightSortable, {
        key: activeSortKey,
        direction: sortConfig.direction,
        groupByRealm: sortConfig.groupByRealm,
      })
    })
  }, [filteredEntries, activeSortKey, sortBehavior, sortConfig.direction, sortConfig.groupByRealm])
  const supportsRealmGrouping = useMemo(
    () => entries.some((entry) => Boolean(entry.realm?.trim())),
    [entries],
  )
  const hasSortControls = sortBehavior === 'CONFIGURABLE' && sortOptions.length > 0
  const hasAtLeastOneRarity = includedRarities
    ? Object.values(includedRarities).some(Boolean)
    : true
  const exportUnavailableReason = getExportUnavailableReason(
    hasAtLeastOneRarity,
    sortedEntries.length,
  )
  const updateDraftConfig = (updater: (current: ExportBoxConfig) => ExportBoxConfig) => {
    setDraftConfig(updater)
  }
  const updateVisuals = (updater: (current: ExportVisualConfig) => ExportVisualConfig) => {
    setVisuals(updater)
    setEmojiAsset(pickRandomEmojiAsset())
  }
  const updateSortConfig = (updater: (current: ExportSortConfig) => ExportSortConfig) => {
    setSortConfig(updater)
  }

  useEffect(() => {
    safeStorageWrite(storage, `${storageKeyPrefix}.layout.v1`, JSON.stringify(sanitizedDraftConfig))
  }, [storage, storageKeyPrefix, sanitizedDraftConfig])

  useEffect(() => {
    safeStorageWrite(storage, `${storageKeyPrefix}.visuals.v1`, JSON.stringify(visuals))
  }, [storage, storageKeyPrefix, visuals])

  useEffect(() => {
    safeStorageWrite(storage, `${storageKeyPrefix}.sort.v1`, JSON.stringify(sortConfig))
  }, [storage, storageKeyPrefix, sortConfig])

  useEffect(() => {
    if (!includedRarities) return
    safeStorageWrite(storage, `${storageKeyPrefix}.rarities.v1`, JSON.stringify(includedRarities))
  }, [storage, storageKeyPrefix, includedRarities])

  function rerollEmoji() {
    setEmojiAsset(pickRandomEmojiAsset())
  }

  async function handleExport() {
    await exportOwnedAssetBoxPreview({
      previewElement: previewRef.current,
      sortedEntries,
      filenamePrefix,
      sanitizedDraftConfig,
      onStatusMessage,
      setIsExporting,
    })
  }

  function handleRarityToggle(rarity: R, checked: boolean) {
    setIncludedRarities((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        [rarity]: checked,
      }
    })
  }

  return (
    <>
      <Button
        className='col-span-2 px-2 py-1 text-[10px] tracking-wide uppercase'
        disabled={entries.length === 0}
        onClick={() => {
          setIsSettingsOpen(true)
        }}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaImage aria-hidden className='text-[10px]' />
          <span>{buttonLabel}</span>
        </span>
      </Button>

      {isSettingsOpen ? (
        <OwnedAssetBoxExportModal
          activeSortKey={activeSortKey}
          areNamesEnabled={areNamesEnabled}
          assetAltNoun={assetAltNoun}
          cardAspectClassName={cardAspectClassName}
          draftConfig={draftConfig}
          emojiAsset={emojiAsset}
          exportUnavailableReason={exportUnavailableReason}
          handleRarityToggle={handleRarityToggle}
          hasSortControls={hasSortControls}
          imageClassName={imageClassName}
          includedRarities={includedRarities}
          isExporting={isExporting}
          modalTitle={modalTitle}
          nameToggleLabel={nameToggleLabel}
          onClose={() => {
            setIsSettingsOpen(false)
          }}
          onDraftConfigChange={updateDraftConfig}
          onExport={() => {
            if (isExporting) {
              return
            }
            void handleExport()
          }}
          onReset={() => {
            setDraftConfig(DEFAULT_EXPORT_BOX_CONFIG)
            setVisuals(DEFAULT_EXPORT_VISUAL_CONFIG)
            setSortConfig(DEFAULT_EXPORT_SORT_CONFIG)
            if (defaultIncludedRarities) {
              setIncludedRarities({...defaultIncludedRarities})
            }
            rerollEmoji()
          }}
          onSortConfigChange={updateSortConfig}
          onVisualsChange={updateVisuals}
          placeholderClassName={placeholderClassName}
          previewRef={previewRef}
          rarityOptions={rarityOptions}
          sanitizedDraftConfig={sanitizedDraftConfig}
          sortConfig={sortConfig}
          sortOptions={sortOptions}
          sortedEntries={sortedEntries}
          supportsLevels={supportsLevels}
          supportsRealmGrouping={supportsRealmGrouping}
          visuals={visuals}
        />
      ) : null}
    </>
  )
}
