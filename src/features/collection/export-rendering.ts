import {getExportLayoutWidth, type ExportBoxConfig, type OwnedAssetBoxEntry} from './export-config'
import {getExportFontEmbedCss} from './export-font-embed'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${String(timeoutMs)}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId)
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}

function createExportRenderOptions(sanitizedDraftConfig: ExportBoxConfig, fontEmbedCSS: string) {
  return {
    cacheBust: false,
    pixelRatio: sanitizedDraftConfig.pixelRatio,
    canvasWidth: getExportLayoutWidth(sanitizedDraftConfig),
    backgroundColor: '#040a16',
    preferredFontFormat: 'woff2' as const,
    ...(fontEmbedCSS ? {fontEmbedCSS} : {}),
  }
}

async function renderOwnedAssetPreviewToDataUrl({
  previewElement,
  baseRenderOptions,
  onStatusMessage,
}: {
  previewElement: HTMLDivElement
  baseRenderOptions: ReturnType<typeof createExportRenderOptions>
  onStatusMessage: (message: string) => void
}) {
  const {toPng} = await import('html-to-image')

  try {
    return await withTimeout(toPng(previewElement, baseRenderOptions), 20000, 'PNG render')
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const isFontEmbedError = /font is undefined|trim/i.test(detail)
    if (!isFontEmbedError) {
      throw error
    }

    onStatusMessage('Rendering PNG (font fallback for Firefox)...')
    return withTimeout(
      toPng(previewElement, {
        ...baseRenderOptions,
        skipFonts: true,
      }),
      20000,
      'PNG render (font fallback)',
    )
  }
}

function downloadOwnedAssetExport(dataUrl: string, filenamePrefix: string) {
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.png`
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  return filename
}

export async function exportOwnedAssetBoxPreview<R extends string>({
  previewElement,
  sortedEntries,
  filenamePrefix,
  sanitizedDraftConfig,
  onStatusMessage,
  setIsExporting,
}: {
  previewElement: HTMLDivElement | null
  sortedEntries: OwnedAssetBoxEntry<R>[]
  filenamePrefix: string
  sanitizedDraftConfig: ExportBoxConfig
  onStatusMessage: (message: string) => void
  setIsExporting: (next: boolean) => void
}) {
  if (!previewElement) {
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
    onStatusMessage('Preparing export fonts...')
    const {css: fontEmbedCSS, hasCustomFont} = await getExportFontEmbedCss()
    if (!hasCustomFont) {
      onStatusMessage('Custom export font unavailable; using fallback font.')
    }
    const baseRenderOptions = createExportRenderOptions(sanitizedDraftConfig, fontEmbedCSS)
    const dataUrl = await renderOwnedAssetPreviewToDataUrl({
      previewElement,
      baseRenderOptions,
      onStatusMessage,
    })

    if (!dataUrl) {
      onStatusMessage('PNG export failed: renderer returned empty image data.')
      return
    }

    const filename = downloadOwnedAssetExport(dataUrl, filenamePrefix)
    onStatusMessage(`Saved ${filename}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    onStatusMessage(`PNG export failed: ${detail || 'could not render image.'}`)
  } finally {
    setIsExporting(false)
  }
}
