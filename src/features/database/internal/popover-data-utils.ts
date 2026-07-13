import {useEffect, useState} from 'react'

import {
  ENLIGHTEN_SLOT_KEYS,
  type AwakenerEnlightenRecord,
  type AwakenerOverlayRecord,
  type AwakenerTalentRecord,
  type DerivedSkillRecord,
  type DescriptionArg,
  type FullStats,
} from '@/domain/awakener-source-schema'
import {resolveDatabaseReferenceInfoById} from '@/domain/database-reference-info'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import {buildDatabaseRichDescriptionText} from '@/domain/database-rich-text'
import {getDescriptionArgProgression, resolveDescriptionTemplate} from '@/domain/description-args'
import type {DescribedRecord} from '@/domain/description-records'
import {resolveDescriptionTemplateAsync} from '@/domain/popover-resolver-client'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {
  type DatabaseReferenceEntry,
  type KeyedDatabaseReferenceEntry,
} from './database-reference-entry'

export interface PopoverUpgrade {
  upgraderType: 'talent' | 'enlighten'
  upgraderId: string
  upgraderSlot?: AwakenerEnlightenRecord['slot']
  patch?: {
    descriptionArgs?: Record<string, DescriptionArg>
  }
}

const getIsTestEnv = (): boolean => {
  if (typeof globalThis === 'undefined') return false
  const g = globalThis as Record<string, unknown>
  if (!g.process || typeof g.process !== 'object') return false
  const p = g.process as Record<string, unknown>
  if (!p.env || typeof p.env !== 'object') return false
  const e = p.env as Record<string, unknown>
  return e.NODE_ENV === 'test'
}
const isTestEnv = getIsTestEnv()

/**
 * Checks if a record type is a derived skill.
 * @param record Database entry record properties.
 * @returns True if derived skill, otherwise false.
 */
export function isDerivedRecord(
  record: DatabaseReferenceEntry['record'],
): record is DerivedSkillRecord {
  return Boolean(record && 'childDerivedSkillIds' in record)
}

/**
 * Checks if a record represents an overlay/tag indicator.
 * @param record Database entry record properties.
 * @returns True if overlay/tag type, otherwise false.
 */
export function isTagOverlay(
  record: DatabaseReferenceEntry['record'],
): record is AwakenerOverlayRecord {
  return Boolean(
    record &&
    typeof record === 'object' &&
    'overlayType' in record &&
    (record.overlayType === 'tag' || record.overlayType === 'mechanic'),
  )
}

/**
 * Retrieves the database reference info children group links.
 * @param referenceLayer Bounded database layer.
 * @param record Database entry record properties.
 * @returns Array of related reference info links.
 */
export function getRelatedReferences(
  referenceLayer: ResolvedDatabaseReferenceLayer | null,
  record: DatabaseReferenceEntry['record'],
): DatabaseReferenceInfo[] {
  if (!referenceLayer || !isDerivedRecord(record) || record.nodeKind !== 'group') {
    return []
  }

  return record.childDerivedSkillIds
    .map((childId) => resolveDatabaseReferenceInfoById(referenceLayer, childId))
    .filter((entry): entry is DatabaseReferenceInfo => entry !== null)
}

/**
 * Strips bracket template markers from visual description summaries.
 * @param entry The database reference entry.
 * @returns Bounded descriptive text string.
 */
export function getRelatedReferencePreview(entry: DatabaseReferenceInfo): string {
  return entry.description.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Builds a popover list entry from raw reference info.
 * @param entry The database reference entry.
 * @returns Configured keyed entry structure.
 */
export function buildRelatedReferenceEntry(
  entry: DatabaseReferenceInfo,
): KeyedDatabaseReferenceEntry {
  return {
    key: `${entry.kind}:${entry.id}`,
    name: entry.name,
    label: entry.label,
    description: entry.description,
    keywordFooterText: entry.keywordFooterText,
    record: entry.record,
    descriptionRank: entry.descriptionRank,
    descriptionMaxRank: entry.descriptionMaxRank,
    influenceBadges: entry.influenceBadges,
  }
}

/**
 * React hook to resolve template references asynchronously for dynamic popover text.
 * @returns The compiled description text.
 */
export function useResolvedDescriptionFallbackText({
  description,
  formulaContext,
  keywordFooterText,
  rank,
  record,
  stats,
}: {
  description: string
  formulaContext?: PublicFormulaContext
  keywordFooterText?: string
  rank?: number
  record?: DatabaseReferenceEntry['record']
  stats: FullStats | null
}): string {
  const [resolvedText, setResolvedText] = useState(() => {
    if (!record) {
      return buildDatabaseRichDescriptionText(description, keywordFooterText)
    }
    const template = record.descriptionTemplate
    if (!template.includes('[') && !template.includes('{')) {
      return buildDatabaseRichDescriptionText(template, keywordFooterText)
    }
    if (isTestEnv) {
      const fallbackSourceText = resolveDescriptionTemplate(template, record.descriptionArgs, {
        rank,
        stats,
        formulaContext,
      })
      return buildDatabaseRichDescriptionText(fallbackSourceText, keywordFooterText)
    }
    return ''
  })

  const [prevDescription, setPrevDescription] = useState(description)
  const [prevRecord, setPrevRecord] = useState(record)
  const [prevRank, setPrevRank] = useState(rank)
  const [prevStats, setPrevStats] = useState(stats)
  const [prevFormulaContext, setPrevFormulaContext] = useState(formulaContext)

  if (
    description !== prevDescription ||
    record !== prevRecord ||
    rank !== prevRank ||
    stats !== prevStats ||
    formulaContext !== prevFormulaContext
  ) {
    setPrevDescription(description)
    setPrevRecord(record)
    setPrevRank(rank)
    setPrevStats(stats)
    setPrevFormulaContext(formulaContext)

    if (record) {
      if (isTestEnv) {
        const res = resolveDescriptionTemplate(record.descriptionTemplate, record.descriptionArgs, {
          rank,
          stats,
          formulaContext,
        })
        setResolvedText(buildDatabaseRichDescriptionText(res, keywordFooterText))
      }
    } else {
      setResolvedText(buildDatabaseRichDescriptionText(description, keywordFooterText))
    }
  }

  useEffect(() => {
    if (!record) {
      return
    }
    let active = true
    void resolveDescriptionTemplateAsync(record.descriptionTemplate, record.descriptionArgs, {
      rank,
      stats,
      formulaContext,
    }).then((res) => {
      if (active) {
        setResolvedText(buildDatabaseRichDescriptionText(res, keywordFooterText))
      }
    })
    return () => {
      active = false
    }
  }, [record, description, keywordFooterText, rank, stats, formulaContext])

  return resolvedText
}

/**
 * Checks if a key represents a skill record.
 * @param key Bounded popover unique key ID.
 * @returns True if skill key pattern matches, otherwise false.
 */
export function isSkillEntryKey(key?: string): boolean {
  return Boolean(
    key &&
    (key.startsWith('skill:') ||
      key.startsWith('derived-skill:') ||
      key.startsWith('enlighten:') ||
      key.startsWith('talent:') ||
      key === 'Exalt' ||
      key === 'OverExalt' ||
      key.startsWith('exalt:') ||
      key.startsWith('over-exalt:')),
  )
}

/**
 * Verifies if a record type is a talent.
 * @param record Described domain record.
 * @returns True if talent record, otherwise false.
 */
export function isTalentRecord(record: DescribedRecord): record is AwakenerTalentRecord {
  return 'family' in record
}

/**
 * Verifies if a record has description parameters.
 * @param record Described domain record.
 * @returns True if arguments map exists, otherwise false.
 */
export function hasDescriptionArgs(
  record: DescribedRecord,
): record is DescribedRecord & {descriptionArgs: Record<string, DescriptionArg>} {
  return 'descriptionArgs' in record
}

/**
 * Resolves base parameter values at specific progression ranks.
 * @param arg Bounded description argument model.
 * @param rank Target level rank.
 * @param levelStart
 * @param maxRank
 * @returns Bounded numeric parameter value.
 */
export function getArgBaseValueAtLevel(
  arg: DescriptionArg,
  rank: number,
  levelStart: number,
  maxRank?: number,
): number {
  const progression = getDescriptionArgProgression(arg, {
    maxRank,
    stats: null,
    formulaContext: {},
  })
  const idx = rank - levelStart
  if (idx < 0 || idx >= progression.length) {
    return 0
  }
  const step = progression[idx]
  return step.baseValue ?? 0
}

/**
 * Returns the maximum upgrade level constraint for a record.
 * @param record Bounded domain record object.
 * @returns Level limit integer, or undefined.
 */
export function getRecordMaxLevel(record: object): number | undefined {
  if ('maxLevel' in record && typeof record.maxLevel === 'number') {
    return record.maxLevel
  }
  return undefined
}

/**
 * Returns available skill upgrades associated with a record.
 * @param record Bounded domain record object.
 * @returns Array of upgrades config.
 */
export function getRecordUpgrades(record: object): PopoverUpgrade[] {
  if ('upgrades' in record) {
    const potentialUpgrades = record.upgrades
    if (Array.isArray(potentialUpgrades)) {
      return potentialUpgrades.filter((u): u is PopoverUpgrade => {
        return typeof u === 'object' && u !== null && 'upgraderType' in u && 'upgraderId' in u
      })
    }
  }
  return []
}

/**
 * Returns active progression upgrades based on enlighten slot settings.
 * @param upgrades Array of all possible upgrades.
 * @param scalingSourceArgKey Bounded target parameter name.
 * @param referenceLayer
 * @param selectedEnlightenSlot
 * @returns Filtered list of upgrades that are active.
 */
export function getActiveUpgrades(
  upgrades: PopoverUpgrade[],
  scalingSourceArgKey: string,
  referenceLayer: ResolvedDatabaseReferenceLayer | null,
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null,
): PopoverUpgrade[] {
  const activeTalentUpgrades = upgrades.filter(
    (u) =>
      u.upgraderType === 'talent' &&
      referenceLayer &&
      referenceLayer.referenceInfoById.has(u.upgraderId) &&
      u.patch?.descriptionArgs?.[scalingSourceArgKey],
  )
  const slotIndex = selectedEnlightenSlot ? ENLIGHTEN_SLOT_KEYS.indexOf(selectedEnlightenSlot) : -1
  const activeEnlightenUpgrades = upgrades.filter(
    (u) =>
      u.upgraderType === 'enlighten' &&
      u.upgraderSlot &&
      ENLIGHTEN_SLOT_KEYS.indexOf(u.upgraderSlot) <= slotIndex &&
      u.patch?.descriptionArgs?.[scalingSourceArgKey],
  )
  activeEnlightenUpgrades.sort((a, b) => {
    const aSlot = a.upgraderSlot
    const bSlot = b.upgraderSlot
    if (!aSlot || !bSlot) return 0
    return ENLIGHTEN_SLOT_KEYS.indexOf(aSlot) - ENLIGHTEN_SLOT_KEYS.indexOf(bSlot)
  })
  return [...activeTalentUpgrades, ...activeEnlightenUpgrades]
}
