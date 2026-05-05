import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'

import {DatabaseRichTextContent} from './DatabaseRichTextContent'

const TEST_OVERLAY: AwakenerOverlayRecord = {
  id: 'overlay.test.counter',
  displayName: 'Counter',
  overlayType: 'mechanic',
  aliases: ['Counter Buff'],
  descriptionTemplate: 'Counter overlay text.',
  descriptionArgs: {},
}

function buildReferenceLayer(): ResolvedDatabaseReferenceLayer {
  return {
    accessibleOverlays: [TEST_OVERLAY],
    cardNames: new Set(['Strike']),
    overlayByName: new Map(),
    referenceInfoById: new Map(),
    referenceInfoByName: new Map(),
  } as ResolvedDatabaseReferenceLayer
}

describe('DatabaseRichTextContent', () => {
  it('renders mixed interactive rich-text tokens from the reference layer and appended footer text', () => {
    const onSkillClick = vi.fn()
    const onMechanicClick = vi.fn()

    render(
      <DatabaseRichTextContent
        keywordFooterText='Retain {Counter Buff}.'
        onMechanicClick={onMechanicClick}
        onSkillClick={onSkillClick}
        referenceLayer={buildReferenceLayer()}
        showTagIcons={false}
        skillLevel={1}
        stats={null}
        text='Gain {Strike} and {Counter}.'
        variant='inline'
      />,
    )

    expect(screen.getByText(/^Gain$/)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Strike'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Counter'})).toBeInTheDocument()
    expect(screen.getByText(/^Retain$/)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Counter Buff'})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Strike'}))
    fireEvent.click(screen.getByRole('button', {name: 'Counter Buff'}))

    expect(onSkillClick).toHaveBeenCalledWith('Strike', expect.any(Object))
    expect(onMechanicClick).toHaveBeenCalledWith(TEST_OVERLAY, expect.any(Object))
  })

  it('uses record descriptions ahead of fallback text at the component seam', () => {
    render(
      <DatabaseRichTextContent
        keywordFooterText='Footer text.'
        record={{
          id: 'skill.test.strike',
          ownerAwakenerId: 1,
          kind: 'strike',
          displayName: 'Strike',
          descriptionTemplate: 'Record text.',
          descriptionArgs: {},
          cardKeywords: [],
          variants: [],
        }}
        referenceLayer={buildReferenceLayer()}
        showTagIcons={false}
        skillLevel={1}
        stats={null}
        text='Fallback text.'
        variant='inline'
      />,
    )

    expect(screen.getByText('Record text.')).toBeInTheDocument()
    expect(screen.getByText('Footer text.')).toBeInTheDocument()
    expect(screen.queryByText('Fallback text.')).not.toBeInTheDocument()
  })
})
