import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { FaImage } from 'react-icons/fa6'
import { Button } from '../../components/ui/Button'
import { ModalFrame } from '../../components/ui/ModalFrame'
import { TogglePill } from '../../components/ui/TogglePill'

export type OwnedAwakenerBoxEntry = {
  name: string
  displayName: string
  level: number
  cardAsset: string | null
}

type OwnedAwakenerBoxExportProps = {
  entries: OwnedAwakenerBoxEntry[]
  onStatusMessage: (message: string) => void
}

type ExportBoxConfig = {
  columns: number
  cardWidthPx: number
  cardGapPx: number
  outerPaddingXPx: number
  outerPaddingYPx: number
  pixelRatio: number
}

type ExportVisualConfig = {
  disableCharacterNames: boolean
  nameOnTop: boolean
  enlightensOnCard: boolean
  disableEmoji: boolean
}

const DEFAULT_EXPORT_BOX_CONFIG: ExportBoxConfig = {
  columns: 8,
  cardWidthPx: 96,
  cardGapPx: 6,
  outerPaddingXPx: 8,
  outerPaddingYPx: 4,
  pixelRatio: 1,
}

const DEFAULT_EXPORT_VISUAL_CONFIG: ExportVisualConfig = {
  disableCharacterNames: false,
  nameOnTop: false,
  enlightensOnCard: false,
  disableEmoji: false,
}

const EXPORT_LAYOUT_STORAGE_KEY = 'skeydb.ownedBoxExport.layout.v1'
const EXPORT_VISUAL_STORAGE_KEY = 'skeydb.ownedBoxExport.visuals.v1'

const emojiAssets = Object.values(
  import.meta.glob('../../assets/emoji/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>
)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function loadStoredLayoutConfig(): ExportBoxConfig {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_BOX_CONFIG
  try {
    const raw = window.localStorage.getItem(EXPORT_LAYOUT_STORAGE_KEY)
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

function loadStoredVisualConfig(): ExportVisualConfig {
  if (typeof window === 'undefined') return DEFAULT_EXPORT_VISUAL_CONFIG
  try {
    const raw = window.localStorage.getItem(EXPORT_VISUAL_STORAGE_KEY)
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

function getExportLayoutWidth(config: ExportBoxConfig) {
  return (
    config.outerPaddingXPx * 2 +
    config.columns * config.cardWidthPx +
    (config.columns - 1) * config.cardGapPx
  )
}

function sanitizeConfig(config: ExportBoxConfig): ExportBoxConfig {
  return {
    columns: clamp(Math.round(config.columns), 3, 10),
    cardWidthPx: clamp(Math.round(config.cardWidthPx), 52, 150),
    cardGapPx: clamp(Math.round(config.cardGapPx), 2, 16),
    outerPaddingXPx: clamp(Math.round(config.outerPaddingXPx), 0, 32),
    outerPaddingYPx: clamp(Math.round(config.outerPaddingYPx), 0, 24),
    pixelRatio: clamp(Number(config.pixelRatio.toFixed(2)), 0.5, 2),
  }
}

type ExportDupeSlotProps = {
  filled: boolean
  slotSizePx: number
  overflowText?: string
}

function ExportDupeSlot({ filled, overflowText, slotSizePx }: ExportDupeSlotProps) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ height: `${slotSizePx}px`, width: `${slotSizePx}px` }}
    >
      <svg aria-hidden className="h-full w-full" viewBox="0 0 24 24">
        <rect
          fill="none"
          height="18"
          stroke="rgba(244, 234, 196, 0.42)"
          strokeWidth="1.1"
          width="18"
          x="3"
          y="3"
        />
        <polygon
          fill="rgba(4, 10, 20, 0.88)"
          points="12,1.75 22.25,12 12,22.25 1.75,12"
          stroke="rgba(244, 234, 196, 0.68)"
          strokeWidth="1.1"
        />
        {filled ? (
          <polygon
            fill="rgba(248, 243, 214, 0.72)"
            points="12,6.6 17.4,12 12,17.4 6.6,12"
            stroke="rgba(248, 243, 214, 0.95)"
            strokeWidth="0.9"
          />
        ) : null}
      </svg>
      {overflowText ? (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold text-[rgba(244,234,196,0.96)]"
          style={{ fontSize: `${Math.max(10, Math.round(slotSizePx * 0.5))}px` }}
        >
          {overflowText}
        </span>
      ) : null}
    </span>
  )
}

function ExportDupeLevelDisplay({ level, slotSizePx }: { level: number; slotSizePx: number }) {
  const filledSlotCount = 3
  const filledDiamondCount = Math.min(level, filledSlotCount)
  const overflowLevel = level > filledSlotCount ? level - filledSlotCount : 0

  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ gap: overflowLevel > 0 ? `${Math.max(1, Math.round(slotSizePx * 0.08))}px` : `${Math.max(2, Math.round(slotSizePx * 0.14))}px` }}
    >
      {Array.from({ length: filledSlotCount }, (_, index) => (
        <ExportDupeSlot filled={index < filledDiamondCount} key={index} slotSizePx={slotSizePx} />
      ))}
      {overflowLevel > 0 ? <ExportDupeSlot filled={false} overflowText={String(overflowLevel)} slotSizePx={slotSizePx} /> : null}
    </span>
  )
}

type ExportPreviewProps = {
  config: ExportBoxConfig
  visuals: ExportVisualConfig
  emojiAsset: string | null
  entries: OwnedAwakenerBoxEntry[]
  previewRef?: React.RefObject<HTMLDivElement | null>
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

function ExportPreview({ config, visuals, emojiAsset, entries, previewRef }: ExportPreviewProps) {
  const exportLayoutWidth = getExportLayoutWidth(config)
  const titleSizePx = Math.round(clamp(config.cardWidthPx * 0.20, 14, 34))
  const titleEmojiSizePx = Math.round(clamp(titleSizePx * 2, 28, 64))
  const nameSizePx = Math.round(clamp(config.cardWidthPx * 0.125, 9, 16))
  const dupeSlotSizePx = Math.round(clamp(config.cardWidthPx * 0.2, 10, 24))
  const onCardDupeOffsetPx = clamp(Math.round(((config.cardWidthPx - 50) / 100) * 10 - 2), -2, 8)

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
        {entries.map((awakener) => (
          <article className="border border-slate-500/45 bg-slate-900/65 p-1" key={awakener.name}>
            <div className="relative aspect-[2/3] overflow-hidden border border-slate-400/35 bg-slate-900">
              {awakener.cardAsset ? (
                <img
                  alt={`${awakener.displayName} card`}
                  className="h-full w-full object-cover object-top scale-110"
                  src={awakener.cardAsset}
                />
              ) : (
                <span className="sigil-placeholder sigil-placeholder-card" />
              )}
              {visuals.enlightensOnCard ? (
                <div
                  className={`absolute right-1 left-1 z-10 flex justify-center ${
                    visuals.disableCharacterNames || visuals.nameOnTop ? 'bottom-1' : 'bottom-6'
                  }`}
                  style={{
                    marginBottom:
                      !visuals.nameOnTop && !visuals.disableCharacterNames
                        ? `${onCardDupeOffsetPx}px`
                        : '0px',
                  }}
                >
                  <ExportDupeLevelDisplay level={awakener.level} slotSizePx={dupeSlotSizePx} />
                </div>
              ) : null}
              {!visuals.disableCharacterNames ? (
                <p
                  className={`absolute right-1 left-1 truncate bg-slate-950/75 px-1 py-1 text-center leading-none text-slate-100 ${
                    visuals.nameOnTop ? 'top-1' : 'bottom-1'
                  }`}
                  style={{ fontSize: `${nameSizePx}px` }}
                >
                  {awakener.displayName}
                </p>
              ) : null}
            </div>
            {!visuals.enlightensOnCard ? (
              <div className="mt-1 flex justify-center">
                <ExportDupeLevelDisplay level={awakener.level} slotSizePx={dupeSlotSizePx} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

export function OwnedAwakenerBoxExport({ entries, onStatusMessage }: OwnedAwakenerBoxExportProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [draftConfig, setDraftConfig] = useState<ExportBoxConfig>(loadStoredLayoutConfig)
  const [visuals, setVisuals] = useState<ExportVisualConfig>(loadStoredVisualConfig)
  const [emojiAsset, setEmojiAsset] = useState<string | null>(() =>
    emojiAssets.length > 0 ? emojiAssets[Math.floor(Math.random() * emojiAssets.length)] : null
  )
  const previewRef = useRef<HTMLDivElement | null>(null)

  const sanitizedDraftConfig = useMemo(() => sanitizeConfig(draftConfig), [draftConfig])
  const areCharacterNamesEnabled = !visuals.disableCharacterNames
  const isEmojiInTitleEnabled = !visuals.disableEmoji

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(EXPORT_LAYOUT_STORAGE_KEY, JSON.stringify(sanitizedDraftConfig))
  }, [sanitizedDraftConfig])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(EXPORT_VISUAL_STORAGE_KEY, JSON.stringify(visuals))
  }, [visuals])

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

    if (entries.length === 0) {
      onStatusMessage('PNG export skipped: no owned awakeners.')
      return
    }

    setIsExporting(true)
    try {
      const exportLayoutWidth = getExportLayoutWidth(sanitizedDraftConfig)
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: sanitizedDraftConfig.pixelRatio,
        canvasWidth: exportLayoutWidth,
        backgroundColor: '#040a16',
      })
      const filename = `skeydb-box-${new Date().toISOString().slice(0, 10)}.png`
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      onStatusMessage(`Saved ${filename}`)
    } catch {
      onStatusMessage('PNG export failed: could not render image.')
    } finally {
      setIsExporting(false)
    }
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
          <span>{`Export box as PNG (owned only)`}</span>
        </span>
      </Button>

      {isSettingsOpen ? (
        <ModalFrame
          panelClassName="flex h-[88vh] w-full max-w-[92vw] flex-col border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]"
          title="Export Owned Box"
        >
          <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_1fr]">
            <div className="collection-scrollbar space-y-2 overflow-auto border border-slate-500/45 bg-slate-900/50 p-3 text-xs text-slate-300">
              <div className="space-y-2 border border-slate-700/60 bg-slate-950/50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-slate-300">Character Names</span>
                  <TogglePill
                    ariaLabel={areCharacterNamesEnabled ? 'Disable character names' : 'Enable character names'}
                    checked={areCharacterNamesEnabled}
                    className="ownership-pill-builder"
                    offLabel="Off"
                    onChange={(characterNamesEnabled) =>
                      setVisuals((current) => ({
                        ...current,
                        disableCharacterNames: !characterNamesEnabled,
                      }))
                    }
                    onLabel="On"
                    variant="flat"
                  />
                </div>
                {areCharacterNamesEnabled ? (
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
                config={sanitizedDraftConfig}
                emojiAsset={emojiAsset}
                entries={entries}
                previewRef={previewRef}
                visuals={visuals}
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <Button
              onClick={() => {
                setDraftConfig(DEFAULT_EXPORT_BOX_CONFIG)
                setVisuals(DEFAULT_EXPORT_VISUAL_CONFIG)
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
              disabled={isExporting || entries.length === 0}
              onClick={handleExport}
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
