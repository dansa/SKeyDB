import {type KeyedDatabaseReferenceEntry} from './database-reference-entry'

export interface PopoverWidthStyleResult {
  width: string
  baseWidth: number
}

/**
 * Resolves the CSS class name for a popover description section based on the lore tone.
 * @param tone The narrative tone of the description section (e.g. 'lore').
 * @returns CSS class string.
 */
export function descriptionSectionClassName(tone: 'default' | 'lore' | undefined): string {
  return [
    'leading-relaxed text-slate-400',
    tone === 'lore' ? 'font-["Droid_Serif"] italic text-slate-300/88' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Returns scaling class constraints for popover elements.
 * @param entry The database reference popover entry.
 * @returns CSS class string.
 */
export function getPopoverWidthClass(entry: KeyedDatabaseReferenceEntry): string {
  if (entry.scalingValues) {
    return 'resize-none overflow-hidden'
  }
  return ''
}

/**
 * Calculates dynamic pixel width configurations for popovers based on text length and children.
 * @param entry The database reference popover entry.
 * @returns Custom React width style properties.
 */
export function getPopoverWidthStyle(entry: KeyedDatabaseReferenceEntry): PopoverWidthStyleResult {
  const scale = 'var(--desc-font-scale, 1)'

  if (entry.key.startsWith('wheel')) {
    return {
      width: `calc(${scale} * 450px)`,
      baseWidth: 450,
    }
  }

  if (entry.scalingValues && entry.scalingValues.length > 0) {
    const baseWidth = entry.scalingValues.length > 3 ? 240 : 180
    return {
      width: `calc(${scale} * ${String(baseWidth)}px)`,
      baseWidth,
    }
  }

  let maxTextLength = entry.description.length
  if (entry.descriptionSections) {
    for (const section of entry.descriptionSections) {
      if (section.description.length > maxTextLength) {
        maxTextLength = section.description.length
      }
    }
  }

  let baseWidth = 240
  if (maxTextLength > 40) {
    baseWidth = Math.min(480, 240 + (maxTextLength - 40))
  }

  const titleLength = entry.name.length
  const titleWidth = Math.round(titleLength * 8.5 + 105)
  baseWidth = Math.max(baseWidth, titleWidth)

  const attrCount = entry.attributeRows?.length ?? 0
  if (attrCount > 0) {
    const attrWidth = attrCount > 3 ? 500 : 420
    baseWidth = Math.max(baseWidth, attrWidth)
  }

  const hasRelatedSkills = Boolean(
    entry.record &&
    'childDerivedSkillIds' in entry.record &&
    Array.isArray(entry.record.childDerivedSkillIds) &&
    entry.record.childDerivedSkillIds.length > 0,
  )
  const hasDetailLinks = (entry.detailLinks?.length ?? 0) > 0

  if (hasRelatedSkills || hasDetailLinks) {
    baseWidth = Math.max(baseWidth, 450)
  }

  baseWidth = Math.round(baseWidth)

  return {
    width: `calc(${scale} * ${String(baseWidth)}px)`,
    baseWidth,
  }
}
