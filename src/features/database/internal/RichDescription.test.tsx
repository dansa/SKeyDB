import type {ComponentProps} from 'react'

import {render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {resolveDescriptionTemplate} from '@/domain/description-args'

import type {RichDescription as RichDescriptionComponent} from './RichDescription'

vi.mock('./database-popover-context', () => ({
  useDatabasePopoverControllerContext: vi.fn(() => null),
}))

beforeEach(() => {
  vi.resetModules()
})

type RichDescriptionProps = ComponentProps<typeof RichDescriptionComponent>

async function renderRichDescription(
  props: RichDescriptionProps,
): Promise<{resolveRichTextContent: () => void}> {
  const unresolvedRichTextContent: () => void = () => {
    throw new Error('Expected lazy rich text content import to register a resolver')
  }
  let resolveRichTextContent = unresolvedRichTextContent

  vi.doMock('./DatabaseRichTextContent', () => {
    return new Promise((resolve) => {
      resolveRichTextContent = () => {
        resolve({
          DatabaseRichTextContent: () => <span>loaded content</span>,
        })
      }
    })
  })

  const {RichDescription} = await import('./RichDescription')
  render(<RichDescription {...props} />)

  await waitFor(() => {
    expect(resolveRichTextContent).not.toBe(unresolvedRichTextContent)
  })

  return {resolveRichTextContent}
}

describe('RichDescription', () => {
  it('shows plain text fallback before deferred rich content resolves', async () => {
    const {resolveRichTextContent} = await renderRichDescription({
      keywordFooterText: 'Prepare 2',
      referenceLayer: null,
      text: 'Deal DMG.\nGain Block.',
    })

    expect(screen.getByText('Deal DMG.')).toBeInTheDocument()
    expect(screen.getByText('Gain Block.')).toBeInTheDocument()
    expect(screen.getByText('Prepare 2')).toBeInTheDocument()

    resolveRichTextContent()

    await waitFor(() => {
      expect(screen.getByText('loaded content')).toBeInTheDocument()
    })
    expect(screen.queryByText('Deal DMG.')).not.toBeInTheDocument()
    expect(screen.queryByText('Gain Block.')).not.toBeInTheDocument()
  })

  it('uses record description text ahead of fallback text in the suspense fallback', async () => {
    const {resolveRichTextContent} = await renderRichDescription({
      keywordFooterText: 'Prepare 2',
      record: {
        id: 'skill.test.prepare',
        ownerAwakenerId: 1,
        kind: 'rouse',
        displayName: 'Prepare',
        descriptionTemplate: 'Record text.',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      referenceLayer: null,
      text: 'Fallback text.',
    })

    expect(screen.getByText('Record text.')).toBeInTheDocument()
    expect(screen.getByText('Prepare 2')).toBeInTheDocument()
    expect(screen.queryByText('Fallback text.')).not.toBeInTheDocument()

    resolveRichTextContent()

    await waitFor(() => {
      expect(screen.getByText('loaded content')).toBeInTheDocument()
    })
  })

  it('supports wheel records through the same suspense seam', async () => {
    const descriptionTemplate = 'Gain [StateArg1]% Keyflare.'
    const descriptionArgs = {
      StateArg1: {
        kind: 'scaling' as const,
        values: ['10', '20', '30', '40'],
        suffix: '%',
      },
    }
    const {resolveRichTextContent} = await renderRichDescription({
      record: {
        id: 'B01',
        kind: 'wheel',
        displayName: 'Merciful Nurturing',
        ownerAwakenerId: 'awakener-0001',
        descriptionTemplate,
        descriptionArgs,
      },
      descriptionRank: 4,
      referenceLayer: null,
      text: 'Fallback wheel text.',
    })

    expect(
      screen.getByText(resolveDescriptionTemplate(descriptionTemplate, descriptionArgs, {rank: 4})),
    ).toBeInTheDocument()
    expect(screen.queryByText('Fallback wheel text.')).not.toBeInTheDocument()

    resolveRichTextContent()

    await waitFor(() => {
      expect(screen.getByText('loaded content')).toBeInTheDocument()
    })
  })
})
