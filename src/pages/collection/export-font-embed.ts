import droidSerifBoldWoff2Url from '@/assets/fonts/droid-serif/DroidSerif-Bold.woff2'
import droidSerifBoldItalicWoff2Url from '@/assets/fonts/droid-serif/DroidSerif-BoldItalic.woff2'
import droidSerifItalicWoff2Url from '@/assets/fonts/droid-serif/DroidSerif-Italic.woff2'
import droidSerifRegularWoff2Url from '@/assets/fonts/droid-serif/DroidSerif.woff2'

export interface ExportFontEmbedResult {
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
          reader.onload = () => {
            if (typeof reader.result !== 'string') {
              reject(new Error(`Unexpected font data format: ${url}`))
              return
            }
            resolve(reader.result)
          }
          reader.onerror = () => {
            reject(new Error(`Failed to read font blob: ${url}`))
          }
          reader.readAsDataURL(blob)
        }),
    )
}

export function getExportFontEmbedCss(): Promise<ExportFontEmbedResult> {
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
      exportFontEmbedCssPromise = null
      return {css: '', hasCustomFont: false}
    })

  return exportFontEmbedCssPromise
}
