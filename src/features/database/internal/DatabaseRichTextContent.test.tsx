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
    overlayByName: new Map([
      ['counter', TEST_OVERLAY],
      ['counter buff', TEST_OVERLAY],
    ]),
    referenceInfoById: new Map(),
    referenceInfoByName: new Map(),
  }
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

  it('renders formatted float description args next to mechanic references', () => {
    const {container} = render(
      <DatabaseRichTextContent
        record={{
          id: 'wheel.test.fragrant-morphogenesis',
          kind: 'wheel',
          displayName: 'Fragrant Morphogenesis',
          descriptionTemplate: 'Cause +[Float:StateArg2]% {Embryo Fusion}.',
          descriptionArgs: {
            StateArg2: {
              kind: 'scaling',
              values: ['0.9', '1.1', '1.3', '1.5'],
            },
          },
        }}
        referenceLayer={{
          ...buildReferenceLayer(),
          accessibleOverlays: [
            {
              id: 'overlay.global.embryo-fusion',
              displayName: 'Embryo Fusion',
              overlayType: 'mechanic',
              aliases: [],
              descriptionTemplate: 'Embryo Fusion text.',
              descriptionArgs: {},
            },
          ],
          overlayByName: new Map(),
        }}
        showTagIcons={false}
        skillLevel={4}
        stats={null}
        variant='inline'
      />,
    )

    expect(container).toHaveTextContent('Cause +1.5% Embryo Fusion.')
    expect(container).not.toHaveTextContent('[Float:StateArg2]')
  })

  it('renders lore redaction markers inside rich text descriptions', () => {
    render(
      <DatabaseRichTextContent
        referenceLayer={buildReferenceLayer()}
        showTagIcons={false}
        skillLevel={1}
        stats={null}
        text='A human in the early stages of the "@2 Ritual."'
        variant='inline'
      />,
    )

    expect(screen.queryByText(/@2/)).not.toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Redacted lore text'})).toBeInTheDocument()
    expect(screen.getByText(/Ritual/)).toBeInTheDocument()
  })
})
