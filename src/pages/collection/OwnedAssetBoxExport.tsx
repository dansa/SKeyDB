import { useEffect, useMemo, useRef, useState } from 'react'
import { FaImage } from 'react-icons/fa6'
import { Button } from '../../components/ui/Button'
import { CollectionSortControls } from '../../components/ui/CollectionSortControls'
import { DupeLevelDisplay } from '../../components/ui/DupeLevelDisplay'
import { ModalFrame } from '../../components/ui/ModalFrame'
import { TogglePill } from '../../components/ui/TogglePill'
import {
  compareAwakenersForCollectionSort,
  compareWheelsForCollectionDefaultSort,
  DEFAULT_AWAKENER_SORT_CONFIG,
  type AwakenerSortKey,
  type CollectionSortDirection,
  type SortableCollectionEntry,
} from '../../domain/collection-sorting'
import droidSerifRegularWoff2Url from '../../assets/fonts/droid-serif/DroidSerif.woff2'
import droidSerifItalicWoff2Url from '../../assets/fonts/droid-serif/DroidSerif-Italic.woff2'
import droidSerifBoldWoff2Url from '../../assets/fonts/droid-serif/DroidSerif-Bold.woff2'
import droidSerifBoldItalicWoff2Url from '../../assets/fonts/droid-serif/DroidSerif-BoldItalic.woff2'

type ExportBoxConfig = {
  columns: number
  cardWidthPx: number
  cardGapPx: number
  levelTextScalePct: number
  outerPaddingXPx: number
  outerPaddingYPx: number
  pixelRatio: number
}

type ExportVisualConfig = {
  disableNames: boolean
  nameOnTop: boolean
  enlightensOnCard: boolean
  showLevels: boolean
  disableEmoji: boolean
}

export type OwnedAssetBoxEntry<R extends string = never> = {
  id: string
  label: string
  level: number
  cardLevel?: number
  asset: string | null
  rarity?: R
  faction?: string
  sortIndex?: number
}

type ExportSortBehavior = 'CONFIGURABLE' | 'WHEEL_DEFAULT'

type ExportSortConfig = {
  key: AwakenerSortKey
  direction: CollectionSortDirection
  groupByFaction: boolean
}

type RarityOption<R extends string> = {
  value: R
  label: string
}

type OwnedAssetBoxExportProps<R extends string = never> = {
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
  rarityOptions?: ReadonlyArray<RarityOption<R>>
  defaultIncludedRarities?: Record<R, boolean>
  sortBehavior?: ExportSortBehavior
  sortOptions?: readonly AwakenerSortKey[]
}

const DEFAULT_EXPORT_BOX_CONFIG: ExportBoxConfig = {
  columns: 8,
  cardWidthPx: 96,
  cardGapPx: 6,
  levelTextScalePct: 100,
  outerPaddingXPx: 8,
  outerPaddingYPx: 4,
  pixelRatio: 1,
}

const DEFAULT_EXPORT_VISUAL_CONFIG: ExportVisualConfig = {
  disableNames: false,
  nameOnTop: false,
  enlightensOnCard: false,
  showLevels: true,
  disableEmoji: false,
}

const DEFAULT_EXPORT_SORT_CONFIG: ExportSortConfig = {
  ...DEFAULT_AWAKENER_SORT_CONFIG,
}

type ExportFontEmbedResult = {
  css: string
  hasCustomFont: boolean
}

let exportFontEmbedCssPromise: Promise<ExportFontEmbedResult> | null = null

function fetchAssetAsDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch font asset: ${url}`)
      }
      return response.blob()
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error(`Failed to read font blob: ${url}`))
          reader.readAsDataURL(blob)
        }),
    )
}

function getExportFontEmbedCss(): Promise<ExportFontEmbedResult> {
  if (exportFontEmbedCssPromise) {
    return exportFontEmbedCssPromise
  }

  exportFontEmbedCssPromise = Promise.all([
    fetchAssetAsDataUrl(droidSerifRegularWoff2Url),
    fetchAssetAsDataUrl(droidSerifItalicWoff2Url),
    fetchAssetAsDataUrl(droidSerifBoldWoff2Url),
    fetchAssetAsDataUrl(droidSerifBoldItalicWoff2Url),
  ])
    .then(([regular, italic, bold, boldItalic]) => ({
      css: `
@font-face {
  font-family: 'Droid Serif';
  src: url('${regular}') format('woff2');
  font-style: normal;
  font-weight: 400;
}
@font-face {
  font-family: 'Droid Serif';
  src: url('${italic}') format('woff2');
  font-style: italic;
  font-weight: 400;
}
@font-face {
  font-family: 'Droid Serif';
  src: url('${bold}') format('woff2');
  font-style: normal;
  font-weight: 700;
}
@font-face {
  font-family: 'Droid Serif';
  src: url('${boldItalic}') format('woff2');
  font-style: italic;
  font-weight: 700;
}
`.trim(),
      hasCustomFont: true,
    }))
    .catch(() => {
      // Allow retry on a future export when a transient fetch/read failure occurs.
      exportFontEmbedCssPromise = null
      return { css: '', hasCustomFont: false }
    })

  return exportFontEmbedCssPromise
}

const emojiAssets = Object.values(
  import.meta.glob('../../assets/emoji/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeConfig(config: ExportBoxConfig): ExportBoxConfig {
  return {
    columns: clamp(Math.round(config.columns), 3, 10),
    cardWidthPx: clamp(Math.round(config.cardWidthPx), 52, 150),
    cardGapPx: clamp(Math.round(config.cardGapPx), 2, 16),
    levelTextScalePct: clamp(Math.round(config.levelTextScalePct), 60, 200),
    outerPaddingXPx: clamp(Math.round(config.outerPaddingXPx), 0, 32),
    outerPaddingYPx: clamp(Math.round(config.outerPaddingYPx), 0, 24),
    pixelRatio: clamp(Number(config.pixelRatio.toFixed(2)), 0.5, 2),
  }
}

function getExportLayoutWidth(config: ExportBoxConfig) {
  return (
    config.outerPaddingXPx * 2 +
    config.columns * config.cardWidthPx +
    (config.columns - 1) * config.cardGapPx
  )
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

function loadStoredLayoutConfig(storageKeyPrefix: string): ExportBoxConfig {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_BOX_CONFIG
  try {
    const raw = window.localStorage.getItem(`${storageKeyPrefix}.layout.v1`)
    if (!raw) return DEFAULT_EXPORT_BOX_CONFIG
    const parsed = JSON.parse(raw) as Partial<ExportBoxConfig>
    return sanitizeConfig({
      ...DEFAULT_EXPORT_BOX_CONFIG,
      ...parsed,
    })
  } catch {
    return DEFAULT_EXPORT_BOX_CONFIG
  }
}

function loadStoredVisualConfig(storageKeyPrefix: string): ExportVisualConfig {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_VISUAL_CONFIG
  try {
    const raw = window.localStorage.getItem(`${storageKeyPrefix}.visuals.v1`)
    if (!raw) return DEFAULT_EXPORT_VISUAL_CONFIG
    const parsed = JSON.parse(raw) as Partial<ExportVisualConfig>
    return {
      ...DEFAULT_EXPORT_VISUAL_CONFIG,
      ...parsed,
    }
  } catch {
    return DEFAULT_EXPORT_VISUAL_CONFIG
  }
}

function loadStoredSortConfig(storageKeyPrefix: string): ExportSortConfig {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_SORT_CONFIG
  try {
    const raw = window.localStorage.getItem(`${storageKeyPrefix}.sort.v1`)
    if (!raw) return DEFAULT_EXPORT_SORT_CONFIG
    const parsed = JSON.parse(raw) as Partial<ExportSortConfig>
    const key = parsed.key ?? DEFAULT_EXPORT_SORT_CONFIG.key
    const direction = parsed.direction ?? DEFAULT_EXPORT_SORT_CONFIG.direction
    return {
      key: key === 'ALPHABETICAL' || key === 'LEVEL' || key === 'ENLIGHTEN' ? key : DEFAULT_EXPORT_SORT_CONFIG.key,
      direction: direction === 'ASC' || direction === 'DESC' ? direction : DEFAULT_EXPORT_SORT_CONFIG.direction,
      groupByFaction: parsed.groupByFaction ?? DEFAULT_EXPORT_SORT_CONFIG.groupByFaction,
    }
  } catch {
    return DEFAULT_EXPORT_SORT_CONFIG
  }
}

function loadStoredIncludedRarities<R extends string>(
  storageKeyPrefix: string,
  defaultIncludedRarities: Record<R, boolean>,
): Record<R, boolean> {
  if (typeof window === 'undefined') return { ...defaultIncludedRarities }
  try {
    const raw = window.localStorage.getItem(`${storageKeyPrefix}.rarities.v1`)
    if (!raw) return { ...defaultIncludedRarities }
    const parsed = JSON.parse(raw) as Partial<Record<R, boolean>>
    return {
      ...defaultIncludedRarities,
      ...parsed,
    }
  } catch {
    return { ...defaultIncludedRarities }
  }
}

type ExportSliderFieldProps = {
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
  const displayValue = valueSuffix ? `${value}${valueSuffix}` : String(value)

  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between gap-2 uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className="rounded border border-slate-500/55 bg-slate-950/80 px-1.5 py-0.5 font-mono text-[11px] text-slate-200 normal-case tracking-normal">
          {displayValue}
        </span>
      </span>
      <input
        className="export-box-slider"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  )
}

type ExportPreviewProps<R extends string> = {
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
      className="bg-[#040a16] text-slate-100"
      ref={previewRef}
      style={{
        width: `${exportLayoutWidth}px`,
        paddingLeft: `${config.outerPaddingXPx}px`,
        paddingRight: `${config.outerPaddingXPx}px`,
        paddingTop: `${config.outerPaddingYPx}px`,
        paddingBottom: `${config.outerPaddingYPx}px`,
      }}
    >
      <header className="mb-1 p-1">
        <div className="flex items-center gap-2">
          <p className="ui-title tracking-wide text-amber-100" style={{ fontSize: `${titleSizePx}px` }}>
            Made with SkeyDB
          </p>
          {!visuals.disableEmoji && emojiAsset ? (
            <img
              alt=""
              aria-hidden
              className="object-scale-down"
              src={emojiAsset}
              style={{ height: `${titleEmojiSizePx}px`, width: `${titleEmojiSizePx}px` }}
            />
          ) : null}
        </div>
      </header>
      <div
        className="grid justify-center"
        style={{
          gap: `${config.cardGapPx}px`,
          gridTemplateColumns: `repeat(${config.columns}, ${config.cardWidthPx}px)`,
        }}
      >
        {entries.map((entry) => (
          <article className="border border-slate-500/45 bg-slate-900/65 p-1" key={entry.id}>
            <div className={`relative overflow-hidden border border-slate-400/35 bg-slate-900 ${cardAspectClassName}`}>
              {entry.asset ? (
                <img alt={`${entry.label} ${assetAltNoun}`} className={imageClassName} src={entry.asset} />
              ) : (
                <span className={`sigil-placeholder ${placeholderClassName}`} />
              )}
              {!visuals.disableNames && visuals.nameOnTop ? (
                <p
                  data-testid="export-preview-card-label"
                  className="absolute top-1 right-1 left-1 z-11 truncate bg-slate-950/75 px-1 py-1 text-center leading-none text-slate-100"
                  style={{
                    fontSize: `${nameSizePx}px`,
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
                    className="pointer-events-none absolute right-1 left-1 bottom-1 z-11 flex flex-col items-center"
                    style={{ gap: `${stackGapPx}px` }}
                  >
                    {hasBottomLevel ? (
                      <p
                        className="ui-title w-full text-left leading-none text-slate-100"
                        style={{
                          fontSize: `${levelSizePx}px`,
                          textShadow: '0 1px 2px rgba(2, 6, 12, 0.9), 0 0 6px rgba(2, 6, 12, 0.65)',
                        }}
                      >
                        <span style={{ fontSize: `${levelPrefixSizePx}px` }}>Lv.</span>
                        <span>{entry.cardLevel}</span>
                      </p>
                    ) : null}
                    {hasBottomDupe ? (
                      <div className="flex w-full justify-center">
                        <DupeLevelDisplay
                          className="inline-flex items-center justify-center text-[rgba(244,234,196,0.96)]"
                          level={entry.level}
                        />
                      </div>
                    ) : null}
                    {hasBottomName ? (
                      <p
                        data-testid="export-preview-card-label"
                        className="w-full truncate bg-slate-950/75 px-1 py-1 text-center leading-none text-slate-100"
                        style={{
                          fontSize: `${nameSizePx}px`,
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
              <div className="mt-1 flex justify-center">
                <DupeLevelDisplay
                  className="inline-flex items-center justify-center text-[rgba(244,234,196,0.96)]"
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [draftConfig, setDraftConfig] = useState<ExportBoxConfig>(() => loadStoredLayoutConfig(storageKeyPrefix))
  const [visuals, setVisuals] = useState<ExportVisualConfig>(() => loadStoredVisualConfig(storageKeyPrefix))
  const [sortConfig, setSortConfig] = useState<ExportSortConfig>(() => loadStoredSortConfig(storageKeyPrefix))
  const [includedRarities, setIncludedRarities] = useState<Record<R, boolean> | null>(() => {
    if (!rarityOptions || !defaultIncludedRarities) {
      return null
    }
    return loadStoredIncludedRarities(storageKeyPrefix, defaultIncludedRarities)
  })
  const [emojiAsset, setEmojiAsset] = useState<string | null>(() =>
    emojiAssets.length > 0 ? emojiAssets[Math.floor(Math.random() * emojiAssets.length)] : null,
  )
  const previewRef = useRef<HTMLDivElement | null>(null)

  const sanitizedDraftConfig = useMemo(() => sanitizeConfig(draftConfig), [draftConfig])
  const areNamesEnabled = !visuals.disableNames
  const isEmojiInTitleEnabled = !visuals.disableEmoji
  const supportsLevels = useMemo(() => entries.some((entry) => typeof entry.cardLevel === 'number'), [entries])
  const filteredEntries = useMemo(() => {
    if (!includedRarities) {
      return entries
    }
    return entries.filter((entry) => (entry.rarity ? includedRarities[entry.rarity] : true))
  }, [entries, includedRarities])
  const sortedEntries = useMemo(() => {
    const activeSortKey = sortOptions.includes(sortConfig.key) ? sortConfig.key : sortOptions[0] ?? 'LEVEL'
    const toSortableEntry = (entry: OwnedAssetBoxEntry<R>): SortableCollectionEntry => ({
      label: entry.label,
      index: entry.sortIndex ?? Number.MAX_SAFE_INTEGER,
      enlighten: entry.level,
      level: entry.cardLevel ?? 0,
      rarity: entry.rarity,
      faction: entry.faction,
    })

    return [...filteredEntries].sort((left, right) => {
      const leftSortable = toSortableEntry(left)
      const rightSortable = toSortableEntry(right)

      if (sortBehavior === 'WHEEL_DEFAULT') {
        return compareWheelsForCollectionDefaultSort(leftSortable, rightSortable)
      }

      return compareAwakenersForCollectionSort(leftSortable, rightSortable, {
        key: activeSortKey,
        direction: sortConfig.direction,
        groupByFaction: sortConfig.groupByFaction,
      })
    })
  }, [filteredEntries, sortBehavior, sortConfig.direction, sortConfig.groupByFaction, sortConfig.key, sortOptions])
  const supportsFactionGrouping = useMemo(() => entries.some((entry) => Boolean(entry.faction?.trim())), [entries])
  const hasSortControls = sortBehavior === 'CONFIGURABLE' && sortOptions.length > 0
  const selectedSortKey = sortOptions.includes(sortConfig.key) ? sortConfig.key : sortOptions[0] ?? 'LEVEL'
  const hasAtLeastOneRarity = includedRarities ? Object.values(includedRarities).some(Boolean) : true
  const exportUnavailableReason = !hasAtLeastOneRarity
    ? 'Enable at least one rarity to export.'
    : sortedEntries.length === 0
      ? 'Nothing matches the current filters.'
      : null

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${storageKeyPrefix}.layout.v1`, JSON.stringify(sanitizedDraftConfig))
  }, [storageKeyPrefix, sanitizedDraftConfig])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${storageKeyPrefix}.visuals.v1`, JSON.stringify(visuals))
  }, [storageKeyPrefix, visuals])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${storageKeyPrefix}.sort.v1`, JSON.stringify(sortConfig))
  }, [storageKeyPrefix, sortConfig])

  useEffect(() => {
    if (typeof window === 'undefined' || !includedRarities) return
    window.localStorage.setItem(`${storageKeyPrefix}.rarities.v1`, JSON.stringify(includedRarities))
  }, [storageKeyPrefix, includedRarities])

  function rerollEmoji() {
    if (emojiAssets.length === 0) {
      setEmojiAsset(null)
      return
    }
    setEmojiAsset(emojiAssets[Math.floor(Math.random() * emojiAssets.length)])
  }

  async function handleExport() {
    if (!previewRef.current) {
      onStatusMessage('PNG export failed: render target missing.')
      return
    }

    if (sortedEntries.length === 0) {
      onStatusMessage('PNG export skipped: nothing to export with current filters.')
      return
    }

    setIsExporting(true)
    onStatusMessage('Rendering PNG...')
    try {
      const { toPng } = await import('html-to-image')
      const exportLayoutWidth = getExportLayoutWidth(sanitizedDraftConfig)
      onStatusMessage('Preparing export fonts...')
      const { css: fontEmbedCSS, hasCustomFont } = await getExportFontEmbedCss()
      if (!hasCustomFont) {
        onStatusMessage('Custom export font unavailable; using fallback font.')
      }
      const baseRenderOptions = {
        cacheBust: false,
        pixelRatio: sanitizedDraftConfig.pixelRatio,
        canvasWidth: exportLayoutWidth,
        backgroundColor: '#040a16',
        preferredFontFormat: 'woff2' as const,
        ...(fontEmbedCSS ? { fontEmbedCSS } : {}),
      }

      let dataUrl: string
      try {
        dataUrl = await withTimeout(toPng(previewRef.current, baseRenderOptions), 20000, 'PNG render')
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        const isFontEmbedError = /font is undefined|trim/i.test(detail)
        if (!isFontEmbedError) {
          throw error
        }

        onStatusMessage('Rendering PNG (font fallback for Firefox)...')
        dataUrl = await withTimeout(
          toPng(previewRef.current, {
            ...baseRenderOptions,
            skipFonts: true,
          }),
          20000,
          'PNG render (font fallback)',
        )
      }

      if (!dataUrl) {
        onStatusMessage('PNG export failed: renderer returned empty image data.')
        return
      }
      const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.png`
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      onStatusMessage(`Saved ${filename}`)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      onStatusMessage(`PNG export failed: ${detail || 'could not render image.'}`)
    } finally {
      setIsExporting(false)
    }
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
        className="col-span-2 px-2 py-1 text-[10px] uppercase tracking-wide"
        disabled={entries.length === 0}
        onClick={() => setIsSettingsOpen(true)}
        type="button"
      >
        <span className="inline-flex items-center gap-1">
          <FaImage aria-hidden className="text-[10px]" />
          <span>{buttonLabel}</span>
        </span>
      </Button>

      {isSettingsOpen ? (
        <ModalFrame
          panelClassName="flex h-[88vh] w-full max-w-[92vw] flex-col border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]"
          title={modalTitle}
        >
          <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_1fr]">
            <div className="collection-scrollbar space-y-2 overflow-auto border border-slate-500/45 bg-slate-900/50 p-3 text-xs text-slate-300">
              {rarityOptions && includedRarities ? (
                <div className="space-y-2 border border-slate-700/60 bg-slate-950/50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">Rarities</p>
                  {rarityOptions.map((option) => (
                    <div className="flex items-center justify-between gap-2" key={option.value}>
                      <span className="text-[11px] uppercase tracking-wide text-slate-300">{option.label}</span>
                      <TogglePill
                        ariaLabel={`Include ${option.label} wheels`}
                        checked={includedRarities[option.value]}
                        className="ownership-pill-builder"
                        offLabel="Off"
                        onChange={(checked) => handleRarityToggle(option.value, checked)}
                        onLabel="On"
                        variant="flat"
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400">Included: {sortedEntries.length}</p>
                </div>
              ) : null}

              {hasSortControls ? (
                <div className="space-y-2 border border-slate-700/60 bg-slate-950/50 p-2">
                  <CollectionSortControls
                    groupByFaction={sortConfig.groupByFaction}
                    groupByFactionAriaLabel="Group by faction"
                    headingText="Sort By"
                    onGroupByFactionChange={(checked) =>
                      setSortConfig((current) => ({
                        ...current,
                        groupByFaction: checked,
                      }))
                    }
                    onSortDirectionToggle={() =>
                      setSortConfig((current) => ({
                        ...current,
                        direction: current.direction === 'DESC' ? 'ASC' : 'DESC',
                      }))
                    }
                    onSortKeyChange={(nextKey) =>
                      setSortConfig((current) => ({
                        ...current,
                        key: nextKey,
                      }))
                    }
                    showGroupByFaction={supportsFactionGrouping}
                    sortDirection={sortConfig.direction}
                    sortKey={selectedSortKey}
                    sortOptions={sortOptions}
                  />
                </div>
              ) : null}

              <div className="space-y-2 border border-slate-700/60 bg-slate-950/50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-slate-300">{nameToggleLabel}</span>
                  <TogglePill
                    ariaLabel={areNamesEnabled ? `Disable ${nameToggleLabel.toLowerCase()}` : `Enable ${nameToggleLabel.toLowerCase()}`}
                    checked={areNamesEnabled}
                    className="ownership-pill-builder"
                    offLabel="Off"
                    onChange={(namesEnabled) =>
                      setVisuals((current) => ({
                        ...current,
                        disableNames: !namesEnabled,
                      }))
                    }
                    onLabel="On"
                    variant="flat"
                  />
                </div>
              {areNamesEnabled ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-slate-300">Name On Top</span>
                    <TogglePill
                      ariaLabel={visuals.nameOnTop ? 'Set names to bottom' : 'Set names to top'}
                      checked={visuals.nameOnTop}
                      className="ownership-pill-builder"
                      offLabel="Off"
                      onChange={(nameOnTop) =>
                        setVisuals((current) => ({
                          ...current,
                          nameOnTop,
                        }))
                      }
                      onLabel="On"
                      variant="flat"
                    />
                </div>
              ) : null}
              {supportsLevels ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-slate-300">Show Levels</span>
                  <TogglePill
                    ariaLabel={visuals.showLevels ? 'Hide levels on card' : 'Show levels on card'}
                    checked={visuals.showLevels}
                    className="ownership-pill-builder"
                    offLabel="Off"
                    onChange={(showLevels) =>
                      setVisuals((current) => ({
                        ...current,
                        showLevels,
                      }))
                    }
                    onLabel="On"
                    variant="flat"
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-300">Enlightens On Card</span>
                <TogglePill
                    ariaLabel={visuals.enlightensOnCard ? 'Move enlightens below card' : 'Move enlightens onto card'}
                    checked={visuals.enlightensOnCard}
                    className="ownership-pill-builder"
                    offLabel="Off"
                    onChange={(enlightensOnCard) =>
                      setVisuals((current) => ({
                        ...current,
                        enlightensOnCard,
                      }))
                    }
                    onLabel="On"
                    variant="flat"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-slate-300">Emoji In Title</span>
                  <TogglePill
                    ariaLabel={isEmojiInTitleEnabled ? 'Disable emoji in title' : 'Enable emoji in title'}
                    checked={isEmojiInTitleEnabled}
                    className="ownership-pill-builder"
                    offLabel="Off"
                    onChange={(emojiInTitleEnabled) => {
                      setVisuals((current) => ({
                        ...current,
                        disableEmoji: !emojiInTitleEnabled,
                      }))
                      rerollEmoji()
                    }}
                    onLabel="On"
                    variant="flat"
                  />
                </div>
              </div>

              <ExportSliderField
                label="Columns"
                max={10}
                min={4}
                onChange={(columns) =>
                  setDraftConfig((current) => ({
                    ...current,
                    columns,
                  }))
                }
                value={draftConfig.columns}
              />
              <ExportSliderField
                label="Card Width"
                max={150}
                min={52}
                onChange={(cardWidthPx) =>
                  setDraftConfig((current) => ({
                    ...current,
                    cardWidthPx,
                  }))
                }
                value={draftConfig.cardWidthPx}
                valueSuffix="px"
              />
              <ExportSliderField
                label="Card Gap"
                max={16}
                min={2}
                onChange={(cardGapPx) =>
                  setDraftConfig((current) => ({
                    ...current,
                    cardGapPx,
                  }))
                }
                value={draftConfig.cardGapPx}
                valueSuffix="px"
              />
              {supportsLevels ? (
                <ExportSliderField
                  label="Level Text Scale"
                  max={200}
                  min={60}
                  onChange={(levelTextScalePct) =>
                    setDraftConfig((current) => ({
                      ...current,
                      levelTextScalePct,
                    }))
                  }
                  step={5}
                  value={draftConfig.levelTextScalePct}
                  valueSuffix="%"
                />
              ) : null}
              <ExportSliderField
                label="Left/Right Padding"
                max={32}
                min={0}
                onChange={(outerPaddingXPx) =>
                  setDraftConfig((current) => ({
                    ...current,
                    outerPaddingXPx,
                  }))
                }
                value={draftConfig.outerPaddingXPx}
                valueSuffix="px"
              />
              <ExportSliderField
                label="Top/Bottom Padding"
                max={24}
                min={0}
                onChange={(outerPaddingYPx) =>
                  setDraftConfig((current) => ({
                    ...current,
                    outerPaddingYPx,
                  }))
                }
                value={draftConfig.outerPaddingYPx}
                valueSuffix="px"
              />
              <ExportSliderField
                label="Pixel Ratio"
                max={2}
                min={0.5}
                onChange={(pixelRatio) =>
                  setDraftConfig((current) => ({
                    ...current,
                    pixelRatio,
                  }))
                }
                step={0.1}
                value={draftConfig.pixelRatio}
              />
              <p className="text-[11px] text-slate-400">
                Pixel ratio controls render density. Higher values look sharper, but increase file size quite a bit.
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                Width: {getExportLayoutWidth(sanitizedDraftConfig)} px
              </div>
            </div>

            <div className="collection-scrollbar min-h-0 overflow-auto border border-slate-500/45 bg-slate-900/45 p-2">
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

          <div className="mt-3 flex justify-end gap-2">
            {exportUnavailableReason ? (
              <p className="mr-auto self-center text-[11px] text-slate-400">{exportUnavailableReason}</p>
            ) : null}
            <Button
              onClick={() => {
                setDraftConfig(DEFAULT_EXPORT_BOX_CONFIG)
                setVisuals(DEFAULT_EXPORT_VISUAL_CONFIG)
                setSortConfig(DEFAULT_EXPORT_SORT_CONFIG)
                if (defaultIncludedRarities) {
                  setIncludedRarities({ ...defaultIncludedRarities })
                }
                rerollEmoji()
              }}
              type="button"
              variant="secondary"
            >
              Reset
            </Button>
            <Button onClick={() => setIsSettingsOpen(false)} type="button" variant="secondary">
              Close
            </Button>
            <Button
              aria-disabled={isExporting}
              className={isExporting ? 'opacity-50' : undefined}
              onClick={() => {
                if (isExporting) {
                  return
                }
                void handleExport()
              }}
              type="button"
              variant="primary"
            >
              {isExporting ? 'Exporting...' : 'Export PNG'}
            </Button>
          </div>
        </ModalFrame>
      ) : null}
    </>
  )
}
