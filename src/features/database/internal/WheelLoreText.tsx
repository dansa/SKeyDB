import {useState, type CSSProperties} from 'react'

import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_FIXED_UTILITY_ACTION_CLASS,
  getDatabaseDetailLorePreviewHeight,
  getDatabaseDetailLoreStyle,
} from './database-detail-typography'
import {DatabaseLoreMarkupText} from './DatabaseLoreMarkupText'

interface WheelLoreTextProps {
  lore: string
  previewLineCount?: number
  defaultExpanded?: boolean
}

type WheelLorePreviewStyle = CSSProperties & {'--wheel-lore-preview-height': string}

function getWheelLorePreviewStyle(previewHeight: string): WheelLorePreviewStyle {
  return {'--wheel-lore-preview-height': previewHeight}
}

function buildLoreKey(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts.map((part) => String(part))].join('-')
}

interface LoreParagraph {
  lines: string[]
}

function buildLoreParagraphs(lore: string): LoreParagraph[] {
  return lore
    .split(/\n{2,}/)
    .map((paragraph) => ({
      lines: paragraph.split('\n').filter((line) => line.trim().length > 0),
    }))
    .filter((paragraph) => paragraph.lines.length > 0)
}

function trimLoreParagraphs(
  paragraphs: LoreParagraph[],
  previewLineCount: number,
): {paragraphs: LoreParagraph[]; truncated: boolean} {
  let remaining = previewLineCount
  const previewParagraphs: LoreParagraph[] = []

  for (const paragraph of paragraphs) {
    if (remaining <= 0) {
      break
    }

    if (paragraph.lines.length <= remaining) {
      previewParagraphs.push(paragraph)
      remaining -= paragraph.lines.length
      continue
    }

    const nextLines = paragraph.lines.slice(0, remaining)
    const lastLineIndex = nextLines.length - 1
    nextLines[lastLineIndex] = `${nextLines[lastLineIndex]}…`
    previewParagraphs.push({lines: nextLines})
    break
  }

  const totalLineCount = paragraphs.reduce((sum, paragraph) => sum + paragraph.lines.length, 0)
  return {
    paragraphs: previewParagraphs,
    truncated: totalLineCount > previewLineCount,
  }
}

function renderLoreParagraphs(paragraphs: LoreParagraph[]) {
  return paragraphs.map((paragraph, paragraphIndex) => (
    <p key={buildLoreKey('wheel-lore-paragraph', paragraphIndex)}>
      {paragraph.lines.map((line, lineIndex) => (
        <span key={buildLoreKey('wheel-lore-line', paragraphIndex, lineIndex)}>
          {lineIndex > 0 ? <br /> : null}
          <DatabaseLoreMarkupText
            keyPrefix={buildLoreKey('wheel-lore', paragraphIndex, lineIndex)}
            text={line}
          />
        </span>
      ))}
    </p>
  ))
}

export function WheelLoreText({
  lore,
  previewLineCount = 4,
  defaultExpanded = false,
}: WheelLoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const paragraphs = buildLoreParagraphs(lore)
  const preview = trimLoreParagraphs(paragraphs, previewLineCount)
  const previewHeight = getDatabaseDetailLorePreviewHeight(previewLineCount)

  return (
    <div className='mt-2 max-w-[66ch]'>
      {preview.truncated ? (
        <div className='wheel-lore-disclosure' style={getWheelLorePreviewStyle(previewHeight)}>
          <div
            className={`wheel-lore-body space-y-3 ${DATABASE_DETAIL_BODY_CLASS}`}
            data-expanded={isExpanded ? 'true' : 'false'}
            data-wheel-lore-content=''
            style={getDatabaseDetailLoreStyle()}
          >
            {renderLoreParagraphs(paragraphs)}
          </div>

          <button
            aria-expanded={isExpanded}
            className={`mt-3 ${DATABASE_DETAIL_FIXED_UTILITY_ACTION_CLASS} text-amber-200/85 hover:text-amber-100`}
            onClick={() => {
              setIsExpanded((current) => !current)
            }}
            type='button'
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      ) : null}

      {!preview.truncated ? (
        <div
          className={`space-y-3 ${DATABASE_DETAIL_BODY_CLASS}`}
          data-wheel-lore-content=''
          style={getDatabaseDetailLoreStyle()}
        >
          {renderLoreParagraphs(paragraphs)}
        </div>
      ) : null}
    </div>
  )
}
