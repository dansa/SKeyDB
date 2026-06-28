import {describe, expect, it} from 'vitest'

import {getAwakenerOverlays, resolveAwakenerOverlay} from './awakener-overlays'
import type {AwakenerOverlayRecord} from './awakener-source-schema'

describe('awakener-overlays', () => {
  it('loads the tracked overlay dataset', async () => {
    const overlays = getAwakenerOverlays()

    expect(overlays.length).toBeGreaterThan(0)
    expect(overlays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'overlay.global.ultra-space',
          displayName: 'Ultra Space',
          overlayType: 'mechanic',
        }),
        expect.objectContaining({
          id: 'overlay.global.exhaust',
          displayName: 'Exhaust',
          overlayType: 'mechanic',
          textColor: 'misc',
        }),
        expect.objectContaining({
          id: 'overlay.global.death-resistance',
          displayName: 'Death Resistance',
          overlayType: 'mechanic',
          textColor: 'heal',
        }),
        expect.objectContaining({
          id: 'overlay.global.tentacle-dmg',
          displayName: 'Tentacle DMG',
          overlayType: 'mechanic',
          textColor: 'misc',
        }),
        expect.objectContaining({
          id: 'overlay.global.echo',
          displayName: 'Echo',
          overlayType: 'mechanic',
          textColor: 'damage',
        }),
        expect.objectContaining({
          id: 'overlay.global.void',
          displayName: 'Void',
          overlayType: 'mechanic',
          textColor: 'aliemus',
          iconId: 'IconS_Buff_027',
        }),
        expect.objectContaining({
          id: 'overlay.global.stun',
          displayName: 'Stun',
          overlayType: 'mechanic',
          textColor: 'misc',
          iconId: 'Battle_Card_Buff_023',
        }),
        expect.objectContaining({
          id: 'overlay.ramona-timeworn.loop',
          displayName: 'Loop',
          overlayType: 'mechanic',
          textColor: 'light',
          iconId: 'IconS_Buff_038',
        }),
        expect.objectContaining({
          id: 'overlay.xu.betroth',
          displayName: 'Betroth',
          overlayType: 'mechanic',
          textColor: 'damage',
          iconId: 'IconS_Buff_080',
        }),
        expect.objectContaining({
          id: 'overlay.xu.enthrall',
          displayName: 'Enthrall',
          overlayType: 'mechanic',
          textColor: 'damage',
          iconId: 'IconS_Buff_080',
        }),
        expect.objectContaining({
          id: 'overlay.24.realm-and-persona',
          ownerAwakenerId: 1,
          displayName: 'Realm and Persona',
          overlayType: 'tag',
        }),
        expect.objectContaining({
          id: 'overlay.horla.metaphor',
          ownerAwakenerId: 24,
          displayName: 'Metaphor',
          overlayType: 'mechanic',
        }),
        expect.objectContaining({
          id: 'overlay.clementine.psychic-trauma',
          ownerAwakenerId: 10,
          displayName: 'Psychic Trauma',
          overlayType: 'mechanic',
        }),
        expect.objectContaining({
          id: 'overlay.murphy-fauxborn.life-seal',
          ownerAwakenerId: 35,
          displayName: 'Life Seal',
          overlayType: 'mechanic',
        }),
      ]),
    )
  })

  it('resolves overlays by display name and alias', () => {
    const overlays: AwakenerOverlayRecord[] = [
      ...getAwakenerOverlays(),
      {
        id: 'overlay.synthetic.realm-effects',
        ownerAwakenerId: 24,
        displayName: 'Realm Effects',
        overlayType: 'realm',
        aliases: ['Realm Effect'],
        descriptionTemplate: '',
        descriptionArgs: {},
      },
    ]

    expect(resolveAwakenerOverlay('Ultra Space', overlays)?.id).toBe('overlay.global.ultra-space')
    expect(resolveAwakenerOverlay('Exhaust', overlays)?.id).toBe('overlay.global.exhaust')
    expect(resolveAwakenerOverlay('Usable 3 times', overlays)?.id).toBe(
      'overlay.global.usable-x-times',
    )
    expect(resolveAwakenerOverlay('Useable 3 times', overlays)?.id).toBe(
      'overlay.global.usable-x-times',
    )
    expect(resolveAwakenerOverlay('Depressed Persona', overlays)).toBeNull()
    expect(resolveAwakenerOverlay('Depressed State', overlays)).toBeNull()
    expect(resolveAwakenerOverlay('Realm and Persona', overlays)?.id).toBe(
      'overlay.24.realm-and-persona',
    )
    expect(resolveAwakenerOverlay('Realm and Persona Effects', overlays)?.id).toBe(
      'overlay.24.realm-and-persona',
    )
    expect(resolveAwakenerOverlay('Psychic Trauma', overlays)?.id).toBe(
      'overlay.clementine.psychic-trauma',
    )
    expect(resolveAwakenerOverlay('Life Seal', overlays)?.id).toBe(
      'overlay.murphy-fauxborn.life-seal',
    )
    expect(resolveAwakenerOverlay('Vulnerability', overlays)?.id).toBe('overlay.global.vulnerable')
    expect(resolveAwakenerOverlay('Memories', overlays)).toBeNull()
    expect(resolveAwakenerOverlay('Realm Effect', overlays)?.id).toBe(
      'overlay.synthetic.realm-effects',
    )
    expect(resolveAwakenerOverlay('Missing Overlay', overlays)).toBeNull()
  })

  it('loads catalog-backed overlays as lightweight reference stubs', () => {
    const overlays = getAwakenerOverlays()

    expect(overlays.find((entry) => entry.id === 'overlay.global.ultra-space')).toMatchObject({
      id: 'overlay.global.ultra-space',
      displayName: 'Ultra Space',
      descriptionTemplate: '',
      descriptionArgs: {},
    })
    expect(overlays.find((entry) => entry.id === 'overlay.global.ultra-space')).not.toHaveProperty(
      'schemaVersion',
    )
  })

  it('does not hydrate full overlay copy from the catalog source', () => {
    const overlays = getAwakenerOverlays()
    const realmAndPersona = overlays.find((entry) => entry.id === 'overlay.24.realm-and-persona')

    expect(realmAndPersona?.descriptionTemplate).toBe('')
    expect(realmAndPersona?.descriptionArgs).toEqual({})
  })
})
