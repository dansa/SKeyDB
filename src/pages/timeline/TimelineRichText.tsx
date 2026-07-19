import {type ReactNode} from 'react'

import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

function isSafeLinkTarget(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function findClosingMarker(text: string, marker: string, from: number): number {
  const index = text.indexOf(marker, from)
  return index > from ? index : -1
}

function parseInlineRichText(
  text: string,
  keyPrefix: string,
  priceMode: TimelinePriceDisplayMode,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let buffer = ''
  let cursor = 0

  const pushBuffer = () => {
    if (!buffer) return
    nodes.push(buffer)
    buffer = ''
  }

  while (cursor < text.length) {
    if (text.startsWith('[', cursor)) {
      const labelEnd = text.indexOf('](', cursor + 1)
      const hrefEnd = labelEnd >= 0 ? text.indexOf(')', labelEnd + 2) : -1
      if (labelEnd > cursor + 1 && hrefEnd > labelEnd + 2) {
        const label = text.slice(cursor + 1, labelEnd)
        const href = text.slice(labelEnd + 2, hrefEnd)
        if (isSafeLinkTarget(href)) {
          pushBuffer()
          const nodeKey = `${keyPrefix}-link-${String(cursor)}`
          nodes.push(
            <a className='text-link' href={href} key={nodeKey} rel='noreferrer' target='_blank'>
              {parseInlineRichText(label, nodeKey, priceMode)}
              <span className='sr-only'> (opens in new tab)</span>
            </a>,
          )
          cursor = hrefEnd + 1
          continue
        }
      }
    }

    if (text.startsWith('**', cursor)) {
      const end = findClosingMarker(text, '**', cursor + 2)
      if (end >= 0) {
        pushBuffer()
        const nodeKey = `${keyPrefix}-strong-${String(cursor)}`
        nodes.push(
          <strong key={nodeKey}>
            {parseInlineRichText(text.slice(cursor + 2, end), nodeKey, priceMode)}
          </strong>,
        )
        cursor = end + 2
        continue
      }
    }

    if (text[cursor] === '*' || text[cursor] === '_') {
      const marker = text[cursor]
      const end = findClosingMarker(text, marker, cursor + 1)
      if (end >= 0) {
        pushBuffer()
        const nodeKey = `${keyPrefix}-em-${String(cursor)}`
        nodes.push(
          <em key={nodeKey}>
            {parseInlineRichText(text.slice(cursor + 1, end), nodeKey, priceMode)}
          </em>,
        )
        cursor = end + 1
        continue
      }
    }

    buffer += text[cursor]
    cursor += 1
  }

  pushBuffer()
  return nodes
}

function TimelineRichTextContent({
  priceMode,
  text,
}: {
  priceMode: TimelinePriceDisplayMode
  text: string
}) {
  const nodes = text.split('\n').flatMap((line, index) => {
    const lineKey = `line-${String(index)}`
    const formattedLine = formatTimelinePrice(line, priceMode) ?? line

    const inlineNodes = parseInlineRichText(formattedLine, lineKey, priceMode)
    if (index === 0) return inlineNodes
    return [<br key={`${lineKey}-break`} />, ...inlineNodes]
  })

  return <>{nodes}</>
}

export function TimelineRichText({
  priceMode = 'silver-prime',
  text,
}: {
  priceMode?: TimelinePriceDisplayMode
  text: string
}) {
  return <TimelineRichTextContent priceMode={priceMode} text={text} />
}
