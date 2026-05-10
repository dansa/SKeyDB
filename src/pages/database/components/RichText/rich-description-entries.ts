import type {AwakenerFull} from '@/domain/awakeners-full'
import {type Tag} from '@/domain/tags'

import type {ScalingTrailEntry, SkillTrailEntry, TagTrailEntry} from '../../utils/popover-trail'

interface CardInfo {
  card: {name: string; description: string; cost?: string}
  label: string
  skillType: 'command' | 'exalt' | 'talent' | 'enlighten'
}

export function resolveRichDescriptionCardInfo(
  awakener: AwakenerFull,
  name: string,
): CardInfo | null {
  const upperName = name.toUpperCase()

  // 1. Match by key (C1, T1, EXALT, etc.)
  const cardByKey = (awakener.cards as Record<string, unknown>)[upperName] as
    | (typeof awakener.cards)[string]
    | undefined
  if (cardByKey) {
    const label = cardByKey.label ?? (upperName === 'C1' ? 'ROUSE' : upperName)
    return {card: cardByKey, label, skillType: 'command'}
  }
  const talentByKey = (awakener.talents as Record<string, unknown>)[upperName] as
    | (typeof awakener.talents)[string]
    | undefined
  if (talentByKey) {
    const label = talentByKey.label ?? `TALENT ${upperName}`
    return {card: talentByKey, label, skillType: 'talent'}
  }
  const enlightenByKey = (awakener.enlightens as Record<string, unknown>)[upperName] as
    | (typeof awakener.enlightens)[string]
    | undefined
  if (enlightenByKey) {
    const label = enlightenByKey.label ?? `ENLIGHTEN ${upperName}`
    return {card: enlightenByKey, label, skillType: 'enlighten'}
  }

  if (upperName === 'EXALT') {
    const {exalt} = awakener.exalts
    return {card: exalt, label: exalt.label ?? 'EXALT', skillType: 'exalt'}
  }
  if (upperName === 'OVER_EXALT' || upperName === 'OVER-EXALT') {
    const {over_exalt} = awakener.exalts
    return {card: over_exalt, label: over_exalt.label ?? 'OVER-EXALT', skillType: 'exalt'}
  }

  // 2. Match by canonical name or special "Rouse" alias for C1
  for (const [key, card] of Object.entries(awakener.cards)) {
    if (card.name === name || (key === 'C1' && name === 'Rouse')) {
      const label = card.label ?? (key === 'C1' ? 'ROUSE' : key)
      return {card, label, skillType: 'command'}
    }
  }
  if (awakener.exalts.exalt.name === name) {
    const {exalt} = awakener.exalts
    return {card: exalt, label: exalt.label ?? 'EXALT', skillType: 'exalt'}
  }
  if (awakener.exalts.over_exalt.name === name) {
    const {over_exalt} = awakener.exalts
    return {card: over_exalt, label: over_exalt.label ?? 'OVER-EXALT', skillType: 'exalt'}
  }
  for (const [key, talent] of Object.entries(awakener.talents)) {
    if (talent.name === name) {
      const label = talent.label ?? `TALENT ${key}`
      return {card: talent, label, skillType: 'talent'}
    }
  }
  for (const [key, enlighten] of Object.entries(awakener.enlightens)) {
    if (enlighten.name === name) {
      const label = enlighten.label ?? `ENLIGHTEN ${key}`
      return {card: enlighten, label, skillType: 'enlighten'}
    }
  }
  return null
}

export function buildRichDescriptionSkillTrailEntry(
  card: {name: string; description: string; cost?: string},
  label: string,
  skillType: SkillTrailEntry['skillType'],
  rect?: DOMRect,
  anchorElement?: HTMLElement,
): SkillTrailEntry {
  return {
    kind: 'skill',
    key: `skill:${card.name}`,
    name: card.name,
    label,
    description: card.description,
    cost: card.cost,
    skillType,
    rect,
    anchorElement,
  }
}

export function buildRichDescriptionTagTrailEntry(
  tag: Tag,
  rect?: DOMRect,
  anchorElement?: HTMLElement,
): TagTrailEntry {
  return {
    kind: 'tag',
    key: `tag:${tag.key}`,
    tag,
    rect,
    anchorElement,
  }
}

export function buildRichDescriptionScalingTrailEntry(
  values: number[],
  suffix: string,
  stat: string | null,
  rect?: DOMRect,
  anchorElement?: HTMLElement,
): ScalingTrailEntry {
  return {
    kind: 'scaling',
    key: `scaling:${stat ?? 'unnamed'}:${values.join(',')}`,
    values,
    suffix,
    stat,
    rect,
    anchorElement,
  }
}

export function hasRouseRichDescriptionCard(awakener: AwakenerFull): boolean {
  return Object.values(awakener.cards).some((card) => card.name === 'Rouse')
}
