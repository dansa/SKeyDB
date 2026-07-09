import {useCallback, useMemo} from 'react'

import {
  ENLIGHTEN_SLOT_KEYS,
  type AwakenerEnlightenRecord,
  type FullStats,
} from '@/domain/awakener-source-schema'
import {isSoulforgeTalent} from '@/domain/awakeners-full-contract'
import {resolveDatabaseReferenceInfoById} from '@/domain/database-reference-info'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import {
  buildDescriptionArgHover,
  getDescriptionArgFormulaBreakdown,
  getDescriptionArgProgression,
  hasAstralReignResearchBonus,
  resolveScaledFormulaResultValue,
  shouldCeilDisplayedTotalValue,
} from '@/domain/description-args'
import {getPublicScaledFormulaBreakdown} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {
  getActiveUpgrades,
  getArgBaseValueAtLevel,
  getRecordMaxLevel,
  getRecordUpgrades,
  hasDescriptionArgs,
  isTalentRecord,
  type PopoverUpgrade,
} from './DatabaseReferencePopoverHelpers'
import {calculateBaseModifier, compileAbstractFormula} from './popover-calculations'

export interface UsePopoverScalingDataProps {
  entry: KeyedDatabaseReferenceEntry
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  stats: FullStats | null
  formulaContext?: PublicFormulaContext
  activeLevel?: number
  simplifyPopoverMultiplier: boolean
}

export function usePopoverScalingData({
  entry,
  referenceLayer,
  selectedEnlightenSlot,
  stats,
  formulaContext,
  activeLevel,
  simplifyPopoverMultiplier,
}: UsePopoverScalingDataProps) {
  const refInfo = useMemo(() => {
    if (!referenceLayer || !entry.scalingSourceRecordId) {
      return null
    }

    return resolveDatabaseReferenceInfoById(referenceLayer, entry.scalingSourceRecordId)
  }, [referenceLayer, entry.scalingSourceRecordId])

  const liveArg = useMemo(() => {
    if (!refInfo || !entry.scalingSourceArgKey) {
      return entry.scalingArg
    }
    const record = refInfo.record
    const arg = hasDescriptionArgs(record)
      ? record.descriptionArgs[entry.scalingSourceArgKey]
      : undefined
    const entryScalingArg = entry.scalingArg
    if (arg && !arg.substatBonus && entryScalingArg?.substatBonus) {
      return {
        ...arg,
        substatBonus: entryScalingArg.substatBonus,
      }
    }
    return arg ?? entryScalingArg
  }, [refInfo, entry.scalingSourceArgKey, entry.scalingArg])

  const originalArg = useMemo(() => {
    if (!refInfo || !entry.scalingSourceArgKey) {
      return undefined
    }
    return refInfo.originalDescriptionArgs?.[entry.scalingSourceArgKey]
  }, [refInfo, entry.scalingSourceArgKey])

  const popoverMaxRank = useMemo(() => {
    return (
      entry.descriptionMaxRank ??
      refInfo?.descriptionMaxRank ??
      (refInfo?.record ? getRecordMaxLevel(refInfo.record) : undefined) ??
      (entry.record ? getRecordMaxLevel(entry.record) : undefined)
    )
  }, [entry.descriptionMaxRank, refInfo, entry.record])

  const liveProgression = useMemo(() => {
    if (!liveArg) {
      return null
    }

    return getDescriptionArgProgression(liveArg, {maxRank: popoverMaxRank, stats, formulaContext})
  }, [liveArg, popoverMaxRank, stats, formulaContext])

  const originalProgression = useMemo(() => {
    if (!originalArg) {
      return null
    }

    return getDescriptionArgProgression(originalArg, {
      maxRank: popoverMaxRank,
      stats: null,
      formulaContext: {},
    })
  }, [originalArg, popoverMaxRank])

  const originalValues = useMemo(() => {
    if (originalProgression) {
      return originalProgression.map((item) => item.baseValue ?? 0)
    }
    return entry.scalingValues ?? []
  }, [originalProgression, entry.scalingValues])

  const getMultipliersForLevelIndex = useCallback(
    (index: number) => {
      const scalingSourceArgKey = entry.scalingSourceArgKey
      if (!liveProgression || !originalProgression || !refInfo || !scalingSourceArgKey) {
        return undefined
      }
      if (index < 0 || index >= originalProgression.length || index >= liveProgression.length) {
        return undefined
      }

      const originalVal = originalProgression[index].baseValue
      const finalVal = liveProgression[index].baseValue
      if (originalVal === null || finalVal === null || originalVal === 0) {
        return undefined
      }

      const upgrades = getRecordUpgrades(refInfo.record)
      const chronologicalUpgrades = getActiveUpgrades(
        upgrades,
        scalingSourceArgKey,
        referenceLayer,
        selectedEnlightenSlot,
      )
      const multipliers: number[] = []
      let runningVal = originalVal
      const levelStart = entry.scalingLevelStart ?? 1
      for (const u of chronologicalUpgrades) {
        const patchArg = u.patch?.descriptionArgs?.[scalingSourceArgKey]
        if (!patchArg) {
          continue
        }
        const nextVal = getArgBaseValueAtLevel(
          patchArg,
          index + levelStart,
          levelStart,
          popoverMaxRank,
        )
        if (Math.abs(nextVal / runningVal - 1) > 1e-4) {
          multipliers.push(nextVal / runningVal)
          runningVal = nextVal
        }
      }
      if (Math.abs(finalVal / runningVal - 1) > 1e-4) {
        multipliers.push(finalVal / runningVal)
      }
      return multipliers
    },
    [
      liveProgression,
      originalProgression,
      refInfo,
      entry.scalingSourceArgKey,
      entry.scalingLevelStart,
      selectedEnlightenSlot,
      referenceLayer,
      popoverMaxRank,
    ],
  )

  const liveFormulas = useMemo(() => {
    if (!liveProgression || !liveArg) {
      return entry.scalingFormulas
    }

    return liveProgression.map((item, index) => {
      if (liveArg.kind === 'computed') {
        return buildDescriptionArgHover(liveArg, {
          rank: index + 1,
          stats,
          formulaContext,
        })
      }
      const originalBaseValue = originalProgression?.[index]?.baseValue ?? undefined
      const multipliers = getMultipliersForLevelIndex(index)
      return getDescriptionArgFormulaBreakdown(
        liveArg,
        item,
        simplifyPopoverMultiplier,
        originalBaseValue,
        multipliers,
      )
    })
  }, [
    liveProgression,
    liveArg,
    originalProgression,
    entry.scalingFormulas,
    simplifyPopoverMultiplier,
    getMultipliersForLevelIndex,
    stats,
    formulaContext,
  ])

  const liveFinalValues = useMemo(() => {
    if (!liveProgression) {
      return entry.scalingFinalValues
    }

    return liveProgression.map((item) => {
      let val = item.totalValue ?? 0
      if (liveArg?.kind === 'computed' && liveArg.formulaKey === 'scaled') {
        const breakdown = getPublicScaledFormulaBreakdown(liveArg, formulaContext)
        if (hasAstralReignResearchBonus(breakdown)) {
          const astralResearchValue = breakdown.baseValue * breakdown.ownedPosseMultiplier
          const astralResultValue = resolveScaledFormulaResultValue(
            astralResearchValue,
            breakdown.multiplier,
          )
          val = astralResultValue
        }
      }
      return val
    })
  }, [liveProgression, entry.scalingFinalValues, liveArg, formulaContext])

  const baseModifier = useMemo(() => {
    return calculateBaseModifier({
      liveProgression,
      originalProgression,
      activeLevel: activeLevel ?? 1,
      levelStart: entry.scalingLevelStart ?? 1,
      getMultipliers: getMultipliersForLevelIndex,
    })
  }, [
    liveProgression,
    originalProgression,
    activeLevel,
    entry.scalingLevelStart,
    getMultipliersForLevelIndex,
  ])

  const liveAbstractFormula = useMemo(() => {
    return compileAbstractFormula({
      liveArg,
      suffix: entry.scalingSuffix ?? '',
      baseModifier,
      fallbackFormula: entry.scalingAbstractFormula,
    })
  }, [liveArg, entry.scalingSuffix, entry.scalingAbstractFormula, baseModifier])

  const liveAbstractFormulaExplanations = useMemo(() => {
    const scalingSourceArgKey = entry.scalingSourceArgKey
    if (!liveProgression || !originalProgression || !refInfo || !scalingSourceArgKey) {
      return []
    }
    const currentLevel = activeLevel
    const levelStart = entry.scalingLevelStart ?? 1
    const activeLevelIndex =
      currentLevel !== undefined &&
      currentLevel - levelStart >= 0 &&
      currentLevel - levelStart < originalProgression.length &&
      currentLevel - levelStart < liveProgression.length
        ? currentLevel - levelStart
        : 0

    const originalItem = originalProgression[activeLevelIndex]
    const liveItem = liveProgression[activeLevelIndex]

    const originalVal = originalItem.baseValue
    const finalVal = liveItem.baseValue
    if (originalVal === null || finalVal === null || originalVal === 0) {
      return []
    }

    const formatMultiplierVal = (v: number) => `${parseFloat(v.toFixed(3)).toString()}x`

    const upgrades = getRecordUpgrades(refInfo.record)
    const explanations: {label: string; value: string; sourceName?: string}[] = []
    const chronologicalUpgrades = getActiveUpgrades(
      upgrades,
      scalingSourceArgKey,
      referenceLayer,
      selectedEnlightenSlot,
    )
    let enlightVal = originalVal
    for (const u of chronologicalUpgrades) {
      const patchArg = u.patch?.descriptionArgs?.[scalingSourceArgKey]
      if (!patchArg) {
        continue
      }
      const nextVal = getArgBaseValueAtLevel(patchArg, currentLevel ?? 1, levelStart)
      if (Math.abs(nextVal / enlightVal - 1) > 1e-4) {
        const upgraderRef = referenceLayer?.referenceInfoById.get(u.upgraderId)
        const label =
          u.upgraderType === 'enlighten'
            ? (u.upgraderSlot ?? 'Enlighten')
            : (upgraderRef?.name ?? 'Talent')
        const val = nextVal / enlightVal
        explanations.push({
          label,
          value: formatMultiplierVal(val),
          sourceName: upgraderRef?.name,
        })
        enlightVal = nextVal
      }
    }
    if (Math.abs(finalVal / enlightVal - 1) > 1e-4) {
      const val = finalVal / enlightVal
      const soulforgeRef = Array.from(referenceLayer?.referenceInfoById.values() ?? []).find(
        (info) =>
          info.kind === 'talent' && isTalentRecord(info.record) && isSoulforgeTalent(info.record),
      )
      explanations.push({
        label: 'SoulForge',
        value: formatMultiplierVal(val),
        sourceName: soulforgeRef?.name,
      })
    }
    if (liveArg?.substatBonus) {
      const slotIndexForSubstat = selectedEnlightenSlot
        ? ENLIGHTEN_SLOT_KEYS.indexOf(selectedEnlightenSlot)
        : -1
      const hasSubstatInBase = Boolean(originalArg?.substatBonus)
      let substatUpgrade: PopoverUpgrade | null = null
      let matchedRef: DatabaseReferenceInfo | null = null
      if (!hasSubstatInBase) {
        const activeTalentUpgradesForSubstat = upgrades.filter(
          (u) =>
            u.upgraderType === 'talent' &&
            referenceLayer &&
            referenceLayer.referenceInfoById.has(u.upgraderId) &&
            u.patch?.descriptionArgs?.[scalingSourceArgKey]?.substatBonus,
        )
        const activeEnlightenUpgradesForSubstat = upgrades.filter(
          (u) =>
            u.upgraderType === 'enlighten' &&
            u.upgraderSlot &&
            ENLIGHTEN_SLOT_KEYS.indexOf(u.upgraderSlot) <= slotIndexForSubstat &&
            u.patch?.descriptionArgs?.[scalingSourceArgKey]?.substatBonus,
        )
        activeEnlightenUpgradesForSubstat.sort((a, b) => {
          const aSlot = a.upgraderSlot
          const bSlot = b.upgraderSlot
          if (!aSlot || !bSlot) {
            return 0
          }
          return ENLIGHTEN_SLOT_KEYS.indexOf(aSlot) - ENLIGHTEN_SLOT_KEYS.indexOf(bSlot)
        })
        const chronologicalSubstatUpgrades = [
          ...activeTalentUpgradesForSubstat,
          ...activeEnlightenUpgradesForSubstat,
        ]
        if (chronologicalSubstatUpgrades.length > 0) {
          substatUpgrade = chronologicalSubstatUpgrades[0]
          matchedRef = referenceLayer?.referenceInfoById.get(substatUpgrade.upgraderId) ?? null
        }
      }
      if (!matchedRef && referenceLayer) {
        const ownerAwakenerId =
          'ownerAwakenerId' in refInfo.record ? refInfo.record.ownerAwakenerId : undefined
        const statName = liveArg.substatBonus.substat.replace(/([a-z])([A-Z])/g, '$1 $2')
        const normalizedStat = statName.toLowerCase().replace(/\s+/g, '')
        if (ownerAwakenerId !== undefined) {
          const characterReferences = Array.from(referenceLayer.referenceInfoById.values()).filter(
            (info) =>
              (info.kind === 'talent' || info.kind === 'enlighten') &&
              'ownerAwakenerId' in info.record &&
              String(info.record.ownerAwakenerId) === String(ownerAwakenerId),
          )
          const matchingRefs = characterReferences.filter((info) => {
            const textToSearch = [
              info.name,
              info.description,
              'descriptionTemplate' in info.record &&
              typeof info.record.descriptionTemplate === 'string'
                ? info.record.descriptionTemplate
                : '',
            ]
              .join(' ')
              .toLowerCase()
              .replace(/\s+/g, '')
            return textToSearch.includes(normalizedStat)
          })
          const activeRefs = matchingRefs.filter((ref) => {
            if (ref.kind === 'enlighten') {
              const slot = 'slot' in ref.record ? ref.record.slot : undefined
              return Boolean(
                slot &&
                slotIndexForSubstat !== -1 &&
                ENLIGHTEN_SLOT_KEYS.indexOf(slot) <= slotIndexForSubstat,
              )
            }
            return true
          })
          if (activeRefs.length > 0) {
            const ref = activeRefs[0]
            matchedRef = ref
            const upgradeObj = upgrades.find((u) => u.upgraderId === ref.id)
            if (upgradeObj) {
              substatUpgrade = upgradeObj
            } else {
              substatUpgrade = {
                upgraderId: ref.id,
                upgraderType: ref.kind === 'enlighten' ? 'enlighten' : 'talent',
                upgraderSlot: 'slot' in ref.record ? ref.record.slot : undefined,
              }
            }
          }
        }
      }
      if (substatUpgrade && matchedRef) {
        const label =
          substatUpgrade.upgraderType === 'enlighten'
            ? (substatUpgrade.upgraderSlot ?? 'Enlighten')
            : matchedRef.name
        const source = liveArg.substatBonus.substat.replace(/([a-z])([A-Z])/g, '$1 $2')
        const mult = liveArg.substatBonus.multiplier
        const mode =
          liveArg.substatBonus.mode ??
          ((entry.scalingSuffix ?? '').includes('%') ? 'scale_base' : 'additive')
        const baseMult = liveArg.substatBonus.baseMultiplier ?? '1'
        const valStr =
          mode === 'scale_base'
            ? `(1 + ${source} × ${mult})`
            : mode === 'additive_factor'
              ? `(${baseMult} + ${source} × ${mult})`
              : `(${source} × ${mult})`
        explanations.push({
          label,
          value: valStr,
          sourceName: matchedRef.name,
        })
      }
    }
    return explanations
  }, [
    liveProgression,
    originalProgression,
    refInfo,
    entry.scalingSourceArgKey,
    activeLevel,
    entry.scalingLevelStart,
    selectedEnlightenSlot,
    referenceLayer,
    originalArg,
    liveArg,
    entry.scalingSuffix,
  ])

  const shouldCeil = useMemo(() => {
    if (!liveArg) {
      return false
    }
    const currentLevel = activeLevel
    const levelStart = entry.scalingLevelStart ?? 1
    const activeLevelIndex =
      currentLevel !== undefined &&
      entry.scalingValues &&
      currentLevel - levelStart >= 0 &&
      currentLevel - levelStart < entry.scalingValues.length
        ? currentLevel - levelStart
        : undefined
    const activeBaseValue =
      activeLevelIndex !== undefined && entry.scalingValues
        ? (entry.scalingValues[activeLevelIndex] ?? null)
        : null
    return shouldCeilDisplayedTotalValue(liveArg, activeBaseValue)
  }, [liveArg, activeLevel, entry.scalingLevelStart, entry.scalingValues])

  return {
    refInfo,
    liveArg,
    originalArg,
    popoverMaxRank,
    liveProgression,
    originalProgression,
    originalValues,
    liveFormulas,
    liveFinalValues,
    baseModifier,
    liveAbstractFormula,
    liveAbstractFormulaExplanations,
    shouldCeil,
  }
}
