import {useState, type CSSProperties, type ReactNode} from 'react'

import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_FIXED_UTILITY_ACTION_CLASS,
  getDatabaseDetailLorePreviewHeight,
  getDatabaseDetailLoreStyle,
} from './database-detail-typography'

interface WheelLoreTextProps {
  lore: string
  previewLineCount?: number
  defaultExpanded?: boolean
}

const LORE_MARKUP_RE = /(@[1-4]|<([A-Za-z]+):([^>]+)>|<([A-Za-z]+)>)/g
const LORE_REDACTION_GLYPH_SETS = {
  1: ['glyph-1'],
  2: ['glyph-2', 'glyph-3'],
  3: ['glyph-2', 'glyph-3', 'glyph-4'],
  4: ['glyph-2', 'glyph-3', 'glyph-4', 'glyph-5'],
} as const

const LORE_REDACTION_GLYPHS = {
  'glyph-1': {
    width: 14,
    viewBox: '0 0 14 14',
    paths: [
      {d: 'M1.2 11.8 2.5 4.8 5.3 3.2 12.4 3.4 8.8 6.2 5.7 8.1 3.7 11.2Z', opacity: '0.96'},
      {d: 'M2.3 10.6 3.1 6.0 4.7 4.9 6.0 5.1 4.8 8.6Z', opacity: '0.42'},
      {d: 'M1.7 5.4 3.8 5.0 3.0 7.0Z', opacity: '0.78'},
    ],
  },
  'glyph-2': {
    width: 18,
    viewBox: '0 0 18 14',
    paths: [
      {d: 'M1.0 8.8 3.0 5.0 6.9 3.6 16.9 3.9 14.0 5.0 9.6 5.8 5.6 7.0 2.0 9.1Z', opacity: '0.96'},
      {d: 'M4.0 7.3 6.1 4.9 8.4 4.4 10.2 4.7 7.5 6.0 5.4 6.7Z', opacity: '0.46'},
      {d: 'M2.2 9.8 3.0 6.9 4.0 5.9 3.7 8.6Z', opacity: '0.68'},
    ],
  },
  'glyph-3': {
    width: 12,
    viewBox: '0 0 12 14',
    paths: [
      {d: 'M1.6 9.4 5.7 4.2 10.5 9.2 8.1 9.0 5.9 8.6 3.7 9.0Z', opacity: '0.96'},
      {d: 'M5.6 5.1 6.7 2.6 7.4 5.4 6.7 8.2 5.8 7.2Z', opacity: '0.44'},
    ],
  },
  'glyph-4': {
    width: 16,
    viewBox: '0 0 16 14',
    paths: [
      {
        d: 'M1.0 11.0 2.1 5.1 4.9 3.6 13.8 3.7 12.6 5.1 9.7 5.3 8.7 6.8 7.0 7.5 4.2 7.7 2.4 10.4Z',
        opacity: '0.96',
      },
      {d: 'M5.8 7.3 7.1 4.7 9.2 4.3 10.4 5.0 9.0 6.5 7.6 6.8Z', opacity: '0.45'},
      {d: 'M2.1 6.0 3.3 5.1 3.0 7.8 2.0 8.8Z', opacity: '0.72'},
      {d: 'M11.5 3.9 12.8 2.5 13.2 4.2 12.3 5.0Z', opacity: '0.62'},
    ],
  },
  'glyph-5': {
    width: 10,
    viewBox: '0 0 10 14',
    paths: [
      {d: 'M1.8 10.8 4.1 4.5 6.5 2.7 8.5 7.2 7.2 8.8 5.1 9.1 3.3 10.0Z', opacity: '0.96'},
      {d: 'M4.4 5.0 5.8 3.8 6.7 6.1 5.8 7.8 4.5 7.2Z', opacity: '0.42'},
    ],
  },
} as const

function formatLoreTokenLabel(token: string): string {
  return token.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function WheelLoreRedaction({level}: {level: 1 | 2 | 3 | 4}) {
  const glyphs = LORE_REDACTION_GLYPH_SETS[level]

  return (
    <span
      aria-label='Redacted lore text'
      className='mx-[0.08em] inline-flex translate-y-[0.08em] items-end gap-px align-baseline'
      role='img'
    >
      {glyphs.map((glyphKey, glyphIndex) => {
        const glyph = LORE_REDACTION_GLYPHS[glyphKey]

        return (
          <svg
            aria-hidden='true'
            data-glyph-key={glyphKey}
            data-lore-redaction-glyph=''
            key={buildLoreKey('wheel-lore-redaction-glyph', level, glyphIndex)}
            style={{
              width: `calc(var(--desc-font-scale, 1) * ${String(glyph.width)}px)`,
              height: 'calc(var(--desc-font-scale, 1) * 14px)',
            }}
            viewBox={glyph.viewBox}
          >
            {glyph.paths.map((path, pathIndex) => (
              <path
                d={path.d}
                fill='currentColor'
                key={buildLoreKey(glyphKey, pathIndex)}
                opacity={path.opacity}
              />
            ))}
          </svg>
        )
      })}
    </span>
  )
}

function buildLoreKey(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts.map((part) => String(part))].join('-')
}

function renderLoreInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let partIndex = 0

  for (const match of text.matchAll(LORE_MARKUP_RE)) {
    const index = match.index
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }

    const [, rawToken, wrappedTagName = '', wrappedTagContent = '', bareTagName = ''] = match

    if (rawToken.startsWith('@')) {
      nodes.push(
        <WheelLoreRedaction
          key={buildLoreKey(keyPrefix, 'redaction', partIndex)}
          level={Number(rawToken.slice(1)) as 1 | 2 | 3 | 4}
        />,
      )
    } else if (wrappedTagName.length > 0) {
      const tagName = wrappedTagName.toLowerCase()
      const content = renderLoreInline(
        wrappedTagContent,
        buildLoreKey(keyPrefix, 'tag', partIndex, wrappedTagName),
      )

      if (tagName === 'italic') {
        nodes.push(
          <em className='italic' key={buildLoreKey(keyPrefix, 'italic', partIndex)}>
            {content}
          </em>,
        )
      } else if (tagName === 'bold') {
        nodes.push(
          <strong className='font-semibold' key={buildLoreKey(keyPrefix, 'bold', partIndex)}>
            {content}
          </strong>,
        )
      } else {
        nodes.push(<span key={buildLoreKey(keyPrefix, 'tag', partIndex)}>{content}</span>)
      }
    } else if (bareTagName.length > 0) {
      nodes.push(
        <span key={buildLoreKey(keyPrefix, 'token', partIndex)}>
          {formatLoreTokenLabel(bareTagName)}
        </span>,
      )
    }

    lastIndex = index + rawToken.length
    partIndex += 1
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
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
          {renderLoreInline(line, buildLoreKey('wheel-lore', paragraphIndex, lineIndex))}
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
        <div
          className='wheel-lore-disclosure'
          style={{'--wheel-lore-preview-height': previewHeight} as CSSProperties}
        >
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
