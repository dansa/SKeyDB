import type {TeamPreviewMode, WheelSlotIndex} from '../builder/types'
import type {
  BuilderV2ActivePosseView,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2PosseOption,
  BuilderV2SlotView,
  BuilderV2TeamSummary,
  BuilderV2WheelOption,
} from './BuilderV2ModelTypes'

const BUILDER_V2_DND_PREFIX = 'builder-v2'
const ID_SEPARATOR = ':'

export type BuilderV2DragKind = 'awakener' | 'wheel' | 'covenant' | 'posse'
export type BuilderV2DragSource = 'picker' | 'team' | 'team-management'
type BuilderV2PickerAwakenerDragInput = Pick<
  BuilderV2AwakenerOption,
  'blockReason' | 'displayName' | 'id' | 'inUseLabel' | 'owned' | 'portraitSrc' | 'realm'
>
type BuilderV2PickerWheelDragInput = Pick<
  BuilderV2WheelOption,
  | 'assetSrc'
  | 'id'
  | 'inUseLabel'
  | 'mainstat'
  | 'name'
  | 'owned'
  | 'rarity'
  | 'recommendationLabel'
>
type BuilderV2PickerCovenantDragInput = Pick<
  BuilderV2CovenantOption,
  'assetSrc' | 'id' | 'inUse' | 'name' | 'recommendationLabel'
>
type BuilderV2PickerPosseDragInput = Pick<
  BuilderV2PosseOption,
  'assetSrc' | 'blocked' | 'id' | 'name' | 'owned' | 'realm' | 'recommended' | 'statusLabel'
>

export type BuilderV2DragPayload =
  | BuilderV2PickerDragPayload
  | BuilderV2TeamAwakenerDragPayload
  | BuilderV2TeamManagementSlotDragPayload
  | BuilderV2TeamManagementWheelDragPayload
  | BuilderV2TeamManagementCovenantDragPayload
  | BuilderV2TeamWheelDragPayload
  | BuilderV2TeamCovenantDragPayload
  | BuilderV2TeamPosseDragPayload

export interface BuilderV2TeamSortDragPayload {
  kind: 'team'
  source: 'team-management'
  teamId: string
}

export type BuilderV2PickerDragPayload =
  | {
      kind: 'awakener'
      source: 'picker'
      id: string
      preview: BuilderV2DragPreviewDescriptor
    }
  | {
      kind: 'wheel'
      source: 'picker'
      id: string
      preview: BuilderV2DragPreviewDescriptor
    }
  | {
      kind: 'covenant'
      source: 'picker'
      id: string
      preview: BuilderV2DragPreviewDescriptor
    }
  | {
      kind: 'posse'
      source: 'picker'
      id: string
      preview: BuilderV2DragPreviewDescriptor
    }

export interface BuilderV2TeamAwakenerDragPayload {
  kind: 'awakener'
  source: 'team'
  id: string
  slotId: string
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2TeamManagementSlotDragPayload {
  kind: 'awakener'
  source: 'team-management'
  id: string
  teamId: string
  slotId: string
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2TeamManagementWheelDragPayload {
  kind: 'wheel'
  source: 'team-management'
  id: string
  teamId: string
  slotId: string
  wheelIndex: WheelSlotIndex
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2TeamManagementCovenantDragPayload {
  kind: 'covenant'
  source: 'team-management'
  id: string
  teamId: string
  slotId: string
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2TeamWheelDragPayload {
  kind: 'wheel'
  source: 'team'
  id: string
  slotId: string
  wheelIndex: WheelSlotIndex
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2TeamCovenantDragPayload {
  kind: 'covenant'
  source: 'team'
  id: string
  slotId: string
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2TeamPosseDragPayload {
  kind: 'posse'
  source: 'team'
  id: string
  preview: BuilderV2DragPreviewDescriptor
}

export interface BuilderV2DragPreviewDescriptor {
  kind: BuilderV2DragKind
  variant: 'item' | 'slot'
  id: string
  title: string
  subtitle: string | null
  imageSrc: string | undefined
  imageAlt: string
  badges: readonly BuilderV2DragPreviewBadge[]
}

export interface BuilderV2TeamDragPreviewDescriptor {
  team: BuilderV2TeamSummary
  index: number
  previewMode: TeamPreviewMode
}

export interface BuilderV2DragPreviewBadge {
  label: string
  tone: 'danger' | 'quiet' | 'recommendation' | 'status' | 'support'
}

export type BuilderV2DropTargetDescriptor =
  | {kind: 'slot'; slotId: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'; slotId: string}
  | {kind: 'posse'}
  | {kind: 'picker'}
  | {kind: 'team-management-slot'; teamId: string; slotId: string}
  | {kind: 'team-management-wheel'; teamId: string; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'team-management-covenant'; teamId: string; slotId: string}

export type BuilderV2DndAction =
  | {kind: 'assign-awakener'; awakenerId: string; slotId: string}
  | {kind: 'assign-awakener-to-team-slot'; awakenerId: string; teamId: string; slotId: string}
  | {kind: 'assign-wheel'; wheelId: string; slotId: string; wheelIndex?: WheelSlotIndex}
  | {
      kind: 'assign-wheel-to-team-slot'
      wheelId: string
      teamId: string
      slotId: string
      wheelIndex?: WheelSlotIndex
    }
  | {kind: 'assign-covenant'; covenantId: string; slotId: string}
  | {kind: 'assign-covenant-to-team-slot'; covenantId: string; teamId: string; slotId: string}
  | {kind: 'assign-posse'; posseId: string}
  | {kind: 'remove-awakener'; slotId: string}
  | {kind: 'remove-team-slot'; teamId: string; slotId: string}
  | {kind: 'move-awakener'; fromSlotId: string; toSlotId: string}
  | {
      kind: 'swap-team-slots'
      sourceTeamId: string
      sourceSlotId: string
      targetTeamId: string
      targetSlotId: string
    }
  | {kind: 'remove-team-wheel'; teamId: string; slotId: string; wheelIndex: WheelSlotIndex}
  | {
      kind: 'move-team-wheel'
      sourceTeamId: string
      sourceSlotId: string
      sourceWheelIndex: WheelSlotIndex
      targetTeamId: string
      targetSlotId: string
      targetWheelIndex: WheelSlotIndex
    }
  | {
      kind: 'move-team-wheel-to-team-slot'
      sourceTeamId: string
      sourceSlotId: string
      sourceWheelIndex: WheelSlotIndex
      targetTeamId: string
      targetSlotId: string
    }
  | {kind: 'remove-team-covenant'; teamId: string; slotId: string}
  | {
      kind: 'move-team-covenant'
      sourceTeamId: string
      sourceSlotId: string
      targetTeamId: string
      targetSlotId: string
    }
  | {kind: 'remove-wheel'; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'remove-covenant'; slotId: string}
  | {
      kind: 'move-wheel'
      fromSlotId: string
      fromWheelIndex: WheelSlotIndex
      toSlotId: string
      toWheelIndex: WheelSlotIndex
    }
  | {
      kind: 'move-wheel-to-slot'
      fromSlotId: string
      fromWheelIndex: WheelSlotIndex
      toSlotId: string
    }
  | {kind: 'move-covenant'; fromSlotId: string; toSlotId: string}

export type BuilderV2DndId = `${typeof BUILDER_V2_DND_PREFIX}:${string}`

interface BuilderV2DndResolutionOptions {
  slots?: readonly BuilderV2SlotView[]
}

export function resolveBuilderV2DndAction(
  payload: BuilderV2DragPayload,
  target: BuilderV2DropTargetDescriptor | null,
  options: BuilderV2DndResolutionOptions = {},
): BuilderV2DndAction | null {
  const effectiveTarget = resolveBuilderV2EffectiveDropTarget(payload, target, options.slots)
  if (!effectiveTarget) {
    return null
  }

  if (payload.source === 'picker') {
    return resolvePickerDndAction(payload, effectiveTarget)
  }

  if (payload.source === 'team-management') {
    return resolveTeamManagementDndAction(payload, effectiveTarget)
  }

  return resolveTeamDndAction(payload, effectiveTarget)
}

export function resolveBuilderV2EffectiveDropTarget(
  payload: BuilderV2DragPayload,
  target: BuilderV2DropTargetDescriptor | null,
  slots?: readonly BuilderV2SlotView[],
): BuilderV2DropTargetDescriptor | null {
  if (!target) {
    return null
  }

  switch (payload.kind) {
    case 'awakener':
      return resolveAwakenerEffectiveTarget(payload, target)
    case 'wheel':
      return resolveWheelEffectiveTarget(payload, target, slots)
    case 'covenant':
      return resolveCovenantEffectiveTarget(payload, target, slots)
    case 'posse':
      return target.kind === 'posse' ? target : null
  }
}

export function createBuilderV2PickerAwakenerDragPayload(
  option: BuilderV2PickerAwakenerDragInput,
): BuilderV2DragPayload {
  return createDragPayload({
    kind: 'awakener',
    source: 'picker',
    id: option.id,
    title: option.displayName,
    subtitle: option.realm,
    imageSrc: option.portraitSrc,
    imageAlt: option.displayName,
    badges: [
      ...createOwnershipBadges(option.owned),
      ...createStatusBadges(option.inUseLabel),
      ...createDangerBadges(option.blockReason),
    ],
  })
}

export function createBuilderV2PickerWheelDragPayload(
  option: BuilderV2PickerWheelDragInput,
): BuilderV2DragPayload {
  return createDragPayload({
    kind: 'wheel',
    source: 'picker',
    id: option.id,
    title: option.name,
    subtitle: option.mainstat,
    imageSrc: option.assetSrc,
    imageAlt: option.name,
    badges: [
      {label: option.rarity, tone: 'quiet'},
      ...createOwnershipBadges(option.owned),
      ...createStatusBadges(option.inUseLabel),
      ...createRecommendationBadges(option.recommendationLabel),
    ],
  })
}

export function createBuilderV2PickerCovenantDragPayload(
  option: BuilderV2PickerCovenantDragInput,
): BuilderV2DragPayload {
  return createDragPayload({
    kind: 'covenant',
    source: 'picker',
    id: option.id,
    title: option.name,
    subtitle: null,
    imageSrc: option.assetSrc,
    imageAlt: option.name,
    badges: [
      ...createStatusBadges(option.inUse ? 'In use' : null),
      ...createRecommendationBadges(option.recommendationLabel),
    ],
  })
}

export function createBuilderV2PickerPosseDragPayload(
  option: BuilderV2PickerPosseDragInput,
): BuilderV2DragPayload {
  return createDragPayload({
    kind: 'posse',
    source: 'picker',
    id: option.id,
    title: option.name,
    subtitle: option.realm,
    imageSrc: option.assetSrc,
    imageAlt: option.name,
    badges: [
      ...createOwnershipBadges(option.owned),
      ...createStatusBadges(option.statusLabel === 'Unowned' ? null : option.statusLabel),
      ...createRecommendationBadges(option.recommended ? 'Recommended' : null),
      ...createDangerBadges(option.blocked ? 'Blocked' : null),
    ],
  })
}

export function createBuilderV2TeamAwakenerDragPayload(
  slot: BuilderV2SlotView,
): BuilderV2DragPayload | null {
  if (!slot.awakener) {
    return null
  }

  return createDragPayload({
    kind: 'awakener',
    source: 'team',
    id: slot.awakener.id,
    slotId: slot.slotId,
    title: slot.awakener.displayName,
    subtitle: slot.slotLabel,
    imageSrc: slot.awakener.cardSrc ?? slot.awakener.portraitSrc,
    imageAlt: slot.awakener.displayName,
    variant: 'slot',
    badges: [
      {label: slot.slotLabel, tone: 'quiet'},
      ...createSupportBadges(slot.awakener.isSupport ? 'Support' : null),
    ],
  })
}

export function createBuilderV2TeamManagementSlotDragPayload(
  team: BuilderV2TeamSummary,
  slot: BuilderV2TeamSummary['slots'][number],
): BuilderV2DragPayload | null {
  if (!slot.awakener) {
    return null
  }

  return createDragPayload({
    kind: 'awakener',
    source: 'team-management',
    id: slot.awakener.id,
    teamId: team.id,
    slotId: slot.slotId,
    title: slot.awakener.displayName,
    subtitle: `${team.name} / ${slot.label}`,
    imageSrc: slot.awakener.cardSrc ?? slot.awakener.portraitSrc,
    imageAlt: slot.awakener.displayName,
    badges: [
      {label: team.name, tone: 'quiet'},
      {label: slot.label, tone: 'quiet'},
      ...createSupportBadges(slot.awakener.isSupport ? 'Support' : null),
    ],
  })
}

export function createBuilderV2TeamManagementWheelDragPayload(
  team: BuilderV2TeamSummary,
  slot: BuilderV2TeamSummary['slots'][number],
  wheelIndex: WheelSlotIndex,
): BuilderV2DragPayload | null {
  const wheel = slot.wheels[wheelIndex]
  if (!wheel) {
    return null
  }

  return createDragPayload({
    kind: 'wheel',
    source: 'team-management',
    id: wheel.id,
    teamId: team.id,
    slotId: slot.slotId,
    wheelIndex,
    title: wheel.name,
    subtitle: `${team.name} / ${slot.label} / Wheel ${String(wheelIndex + 1)}`,
    imageSrc: wheel.assetSrc ?? wheel.miniAssetSrc,
    imageAlt: wheel.name,
    badges: [
      {label: team.name, tone: 'quiet'},
      {label: slot.label, tone: 'quiet'},
      {label: `Wheel ${String(wheelIndex + 1)}`, tone: 'quiet'},
    ],
  })
}

export function createBuilderV2TeamManagementCovenantDragPayload(
  team: BuilderV2TeamSummary,
  slot: BuilderV2TeamSummary['slots'][number],
): BuilderV2DragPayload | null {
  if (!slot.covenant) {
    return null
  }

  return createDragPayload({
    kind: 'covenant',
    source: 'team-management',
    id: slot.covenant.id,
    teamId: team.id,
    slotId: slot.slotId,
    title: slot.covenant.name,
    subtitle: `${team.name} / ${slot.label}`,
    imageSrc: slot.covenant.assetSrc,
    imageAlt: slot.covenant.name,
    badges: [
      {label: team.name, tone: 'quiet'},
      {label: slot.label, tone: 'quiet'},
    ],
  })
}

export function createBuilderV2TeamWheelDragPayload(
  slot: BuilderV2SlotView,
  wheelIndex: WheelSlotIndex,
): BuilderV2DragPayload | null {
  const wheelSlot = slot.wheelSlots[wheelIndex]
  if (!wheelSlot.wheelId || !wheelSlot.wheelName) {
    return null
  }

  return createDragPayload({
    kind: 'wheel',
    source: 'team',
    id: wheelSlot.wheelId,
    slotId: slot.slotId,
    wheelIndex,
    title: wheelSlot.wheelName,
    subtitle: `${slot.slotLabel} / ${wheelSlot.label}`,
    imageSrc: wheelSlot.assetSrc,
    imageAlt: wheelSlot.wheelName,
    badges: [
      {label: slot.slotLabel, tone: 'quiet'},
      {label: wheelSlot.label, tone: 'quiet'},
    ],
  })
}

export function createBuilderV2TeamCovenantDragPayload(
  slot: BuilderV2SlotView,
): BuilderV2DragPayload | null {
  if (!slot.covenantId || !slot.covenantName) {
    return null
  }

  return createDragPayload({
    kind: 'covenant',
    source: 'team',
    id: slot.covenantId,
    slotId: slot.slotId,
    title: slot.covenantName,
    subtitle: slot.slotLabel,
    imageSrc: slot.covenantAssetSrc,
    imageAlt: slot.covenantName,
    badges: [{label: slot.slotLabel, tone: 'quiet'}],
  })
}

export function createBuilderV2TeamPosseDragPayload(
  activePosse: BuilderV2ActivePosseView | null,
): BuilderV2DragPayload | null {
  if (!activePosse) {
    return null
  }

  return createDragPayload({
    kind: 'posse',
    source: 'team',
    id: activePosse.id,
    title: activePosse.name,
    subtitle: activePosse.realm,
    imageSrc: activePosse.assetSrc,
    imageAlt: activePosse.name,
    badges: [{label: activePosse.realm, tone: 'quiet'}],
  })
}

export function createBuilderV2TeamSortDragPayload(teamId: string): BuilderV2TeamSortDragPayload {
  return {
    kind: 'team',
    source: 'team-management',
    teamId,
  }
}

export function makeBuilderV2SlotDndId(slotId: string): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:slot:${slotId}`
}

export function makeBuilderV2WheelDndId(
  slotId: string,
  wheelIndex: WheelSlotIndex,
): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:wheel:${slotId}:${String(wheelIndex)}`
}

export function makeBuilderV2CovenantDndId(slotId: string): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:covenant:${slotId}`
}

export function makeBuilderV2PosseDndId(): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:posse`
}

export function makeBuilderV2PickerDndId(): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:picker`
}

export function makeBuilderV2TeamManagementSlotDndId(
  teamId: string,
  slotId: string,
): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:team-management-slot:${teamId}:${slotId}`
}

export function makeBuilderV2TeamManagementWheelDndId(
  teamId: string,
  slotId: string,
  wheelIndex: WheelSlotIndex,
): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:team-management-wheel:${teamId}:${slotId}:${String(wheelIndex)}`
}

export function makeBuilderV2TeamManagementCovenantDndId(
  teamId: string,
  slotId: string,
): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:team-management-covenant:${teamId}:${slotId}`
}

export function makeBuilderV2TeamAwakenerDragId(slotId: string): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:team-awakener:${slotId}`
}

export function makeBuilderV2TeamWheelDragId(
  slotId: string,
  wheelIndex: WheelSlotIndex,
): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:team-wheel:${slotId}:${String(wheelIndex)}`
}

export function makeBuilderV2TeamCovenantDragId(slotId: string): BuilderV2DndId {
  return `${BUILDER_V2_DND_PREFIX}:team-covenant:${slotId}`
}

export function parseBuilderV2DndId(id: unknown): BuilderV2DropTargetDescriptor | null {
  if (typeof id !== 'string' || !id.startsWith(`${BUILDER_V2_DND_PREFIX}${ID_SEPARATOR}`)) {
    return null
  }

  const remainder = id.slice(BUILDER_V2_DND_PREFIX.length + ID_SEPARATOR.length)
  if (remainder === 'posse') {
    return {kind: 'posse'}
  }
  if (remainder === 'picker') {
    return {kind: 'picker'}
  }

  const targetSeparatorIndex = remainder.indexOf(ID_SEPARATOR)
  if (targetSeparatorIndex < 0) {
    return null
  }

  const targetKind = remainder.slice(0, targetSeparatorIndex)
  const targetValue = remainder.slice(targetSeparatorIndex + ID_SEPARATOR.length)
  if (!targetValue) {
    return null
  }

  switch (targetKind) {
    case 'slot':
      return {kind: 'slot', slotId: targetValue}
    case 'covenant':
      return {kind: 'covenant', slotId: targetValue}
    case 'wheel':
      return parseWheelDropTarget(targetValue)
    case 'team-management-slot':
      return parseTeamManagementSlotDropTarget(targetValue)
    case 'team-management-wheel':
      return parseTeamManagementWheelDropTarget(targetValue)
    case 'team-management-covenant':
      return parseTeamManagementCovenantDropTarget(targetValue)
    default:
      return null
  }
}

export function isBuilderV2DragPayload(value: unknown): value is BuilderV2DragPayload {
  if (!isRecord(value) || !isBuilderV2DragKind(value.kind)) {
    return false
  }

  if (
    (value.source !== 'picker' && value.source !== 'team' && value.source !== 'team-management') ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    !isDragPreviewDescriptor(value.preview) ||
    value.preview.kind !== value.kind ||
    value.preview.id !== value.id
  ) {
    return false
  }

  if (value.source === 'picker') {
    return true
  }

  if (value.source === 'team-management') {
    if (
      typeof value.teamId !== 'string' ||
      value.teamId.length === 0 ||
      typeof value.slotId !== 'string' ||
      value.slotId.length === 0
    ) {
      return false
    }

    return (
      value.kind === 'awakener' ||
      value.kind === 'covenant' ||
      (value.kind === 'wheel' && (value.wheelIndex === 0 || value.wheelIndex === 1))
    )
  }

  if (value.kind === 'posse') {
    return true
  }

  if (typeof value.slotId !== 'string' || value.slotId.length === 0) {
    return false
  }

  return value.kind !== 'wheel' || value.wheelIndex === 0 || value.wheelIndex === 1
}

export function isBuilderV2TeamSortDragPayload(
  value: unknown,
): value is BuilderV2TeamSortDragPayload {
  return (
    isRecord(value) &&
    value.kind === 'team' &&
    value.source === 'team-management' &&
    typeof value.teamId === 'string' &&
    value.teamId.length > 0
  )
}

function parseWheelDropTarget(targetValue: string): BuilderV2DropTargetDescriptor | null {
  const separatorIndex = targetValue.lastIndexOf(ID_SEPARATOR)
  if (separatorIndex <= 0 || separatorIndex === targetValue.length - 1) {
    return null
  }

  const slotId = targetValue.slice(0, separatorIndex)
  const wheelIndex = parseWheelSlotIndex(targetValue.slice(separatorIndex + ID_SEPARATOR.length))
  return wheelIndex === null ? null : {kind: 'wheel', slotId, wheelIndex}
}

function parseTeamManagementSlotDropTarget(
  targetValue: string,
): BuilderV2DropTargetDescriptor | null {
  const separatorIndex = targetValue.indexOf(ID_SEPARATOR)
  if (separatorIndex <= 0 || separatorIndex === targetValue.length - 1) {
    return null
  }

  return {
    kind: 'team-management-slot',
    teamId: targetValue.slice(0, separatorIndex),
    slotId: targetValue.slice(separatorIndex + ID_SEPARATOR.length),
  }
}

function parseTeamManagementWheelDropTarget(
  targetValue: string,
): BuilderV2DropTargetDescriptor | null {
  const teamSeparatorIndex = targetValue.indexOf(ID_SEPARATOR)
  const wheelSeparatorIndex = targetValue.lastIndexOf(ID_SEPARATOR)
  if (
    teamSeparatorIndex <= 0 ||
    wheelSeparatorIndex <= teamSeparatorIndex + ID_SEPARATOR.length ||
    wheelSeparatorIndex === targetValue.length - 1
  ) {
    return null
  }

  const wheelIndex = parseWheelSlotIndex(
    targetValue.slice(wheelSeparatorIndex + ID_SEPARATOR.length),
  )
  if (wheelIndex === null) {
    return null
  }

  return {
    kind: 'team-management-wheel',
    teamId: targetValue.slice(0, teamSeparatorIndex),
    slotId: targetValue.slice(teamSeparatorIndex + ID_SEPARATOR.length, wheelSeparatorIndex),
    wheelIndex,
  }
}

function parseTeamManagementCovenantDropTarget(
  targetValue: string,
): BuilderV2DropTargetDescriptor | null {
  const teamSlotTarget = parseTeamManagementSlotDropTarget(targetValue)
  if (teamSlotTarget?.kind !== 'team-management-slot') {
    return null
  }

  return {
    kind: 'team-management-covenant',
    teamId: teamSlotTarget.teamId,
    slotId: teamSlotTarget.slotId,
  }
}

function resolvePickerDndAction(
  payload: BuilderV2PickerDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (getTeamManagementSlotTarget(target)) {
    return resolvePickerTeamManagementDndAction(payload, target)
  }

  switch (payload.kind) {
    case 'awakener':
      return resolveSlotOwnedTarget(target, (slotId) => ({
        kind: 'assign-awakener',
        awakenerId: payload.id,
        slotId,
      }))
    case 'wheel':
      return resolvePickerWheelDndAction(payload, target)
    case 'covenant':
      return resolveSlotOwnedTarget(target, (slotId) => ({
        kind: 'assign-covenant',
        covenantId: payload.id,
        slotId,
      }))
    case 'posse':
      return target.kind === 'posse' ? {kind: 'assign-posse', posseId: payload.id} : null
  }
}

function resolvePickerTeamManagementDndAction(
  payload: BuilderV2PickerDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  const slotTarget = getTeamManagementSlotTarget(target)
  if (!slotTarget) {
    return null
  }

  switch (payload.kind) {
    case 'awakener':
      return {
        kind: 'assign-awakener-to-team-slot',
        awakenerId: payload.id,
        teamId: slotTarget.teamId,
        slotId: slotTarget.slotId,
      }
    case 'wheel':
      return {
        kind: 'assign-wheel-to-team-slot',
        wheelId: payload.id,
        teamId: slotTarget.teamId,
        slotId: slotTarget.slotId,
        wheelIndex: target.kind === 'team-management-wheel' ? target.wheelIndex : undefined,
      }
    case 'covenant':
      return {
        kind: 'assign-covenant-to-team-slot',
        covenantId: payload.id,
        teamId: slotTarget.teamId,
        slotId: slotTarget.slotId,
      }
    case 'posse':
      return null
  }
}

function resolvePickerWheelDndAction(
  payload: Extract<BuilderV2PickerDragPayload, {kind: 'wheel'}>,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  switch (target.kind) {
    case 'wheel':
      return {
        kind: 'assign-wheel',
        wheelId: payload.id,
        slotId: target.slotId,
        wheelIndex: target.wheelIndex,
      }
    case 'slot':
    case 'covenant':
      return {kind: 'assign-wheel', wheelId: payload.id, slotId: target.slotId}
    default:
      return null
  }
}

function resolveTeamDndAction(
  payload:
    | BuilderV2TeamAwakenerDragPayload
    | BuilderV2TeamWheelDragPayload
    | BuilderV2TeamCovenantDragPayload
    | BuilderV2TeamPosseDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  switch (payload.kind) {
    case 'awakener':
      return resolveTeamAwakenerDndAction(payload, target)
    case 'wheel':
      return resolveTeamWheelDndAction(payload, target)
    case 'covenant':
      return resolveTeamCovenantDndAction(payload, target)
    case 'posse':
      return null
  }
}

function resolveTeamManagementDndAction(
  payload:
    | BuilderV2TeamManagementSlotDragPayload
    | BuilderV2TeamManagementWheelDragPayload
    | BuilderV2TeamManagementCovenantDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  switch (payload.kind) {
    case 'awakener':
      return resolveTeamManagementAwakenerDndAction(payload, target)
    case 'wheel':
      return resolveTeamManagementWheelDndAction(payload, target)
    case 'covenant':
      return resolveTeamManagementCovenantDndAction(payload, target)
  }
}

function resolveTeamManagementAwakenerDndAction(
  payload: BuilderV2TeamManagementSlotDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (target.kind === 'picker') {
    return {kind: 'remove-team-slot', teamId: payload.teamId, slotId: payload.slotId}
  }

  const slotTarget = getTeamManagementSlotTarget(target)
  if (!slotTarget) {
    return null
  }

  if (slotTarget.teamId === payload.teamId && slotTarget.slotId === payload.slotId) {
    return null
  }

  return {
    kind: 'swap-team-slots',
    sourceTeamId: payload.teamId,
    sourceSlotId: payload.slotId,
    targetTeamId: slotTarget.teamId,
    targetSlotId: slotTarget.slotId,
  }
}

function resolveTeamManagementWheelDndAction(
  payload: BuilderV2TeamManagementWheelDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (target.kind === 'picker') {
    return {
      kind: 'remove-team-wheel',
      teamId: payload.teamId,
      slotId: payload.slotId,
      wheelIndex: payload.wheelIndex,
    }
  }

  if (target.kind === 'team-management-wheel') {
    if (
      target.teamId === payload.teamId &&
      target.slotId === payload.slotId &&
      target.wheelIndex === payload.wheelIndex
    ) {
      return null
    }

    return {
      kind: 'move-team-wheel',
      sourceTeamId: payload.teamId,
      sourceSlotId: payload.slotId,
      sourceWheelIndex: payload.wheelIndex,
      targetTeamId: target.teamId,
      targetSlotId: target.slotId,
      targetWheelIndex: target.wheelIndex,
    }
  }

  const slotTarget = getTeamManagementSlotTarget(target)
  if (!slotTarget) {
    return null
  }

  return {
    kind: 'move-team-wheel-to-team-slot',
    sourceTeamId: payload.teamId,
    sourceSlotId: payload.slotId,
    sourceWheelIndex: payload.wheelIndex,
    targetTeamId: slotTarget.teamId,
    targetSlotId: slotTarget.slotId,
  }
}

function resolveTeamManagementCovenantDndAction(
  payload: BuilderV2TeamManagementCovenantDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (target.kind === 'picker') {
    return {kind: 'remove-team-covenant', teamId: payload.teamId, slotId: payload.slotId}
  }

  const slotTarget = getTeamManagementSlotTarget(target)
  if (!slotTarget) {
    return null
  }

  if (slotTarget.teamId === payload.teamId && slotTarget.slotId === payload.slotId) {
    return null
  }

  return {
    kind: 'move-team-covenant',
    sourceTeamId: payload.teamId,
    sourceSlotId: payload.slotId,
    targetTeamId: slotTarget.teamId,
    targetSlotId: slotTarget.slotId,
  }
}

function resolveTeamAwakenerDndAction(
  payload: BuilderV2TeamAwakenerDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (target.kind === 'picker') {
    return {kind: 'remove-awakener', slotId: payload.slotId}
  }

  if (target.kind !== 'slot' && target.kind !== 'wheel' && target.kind !== 'covenant') {
    return null
  }

  if (target.slotId === payload.slotId) {
    return null
  }

  return {kind: 'move-awakener', fromSlotId: payload.slotId, toSlotId: target.slotId}
}

function resolveTeamWheelDndAction(
  payload: BuilderV2TeamWheelDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (target.kind === 'picker') {
    return {kind: 'remove-wheel', slotId: payload.slotId, wheelIndex: payload.wheelIndex}
  }

  if (target.kind !== 'wheel') {
    return target.kind === 'slot' || target.kind === 'covenant'
      ? {
          kind: 'move-wheel-to-slot',
          fromSlotId: payload.slotId,
          fromWheelIndex: payload.wheelIndex,
          toSlotId: target.slotId,
        }
      : null
  }

  if (target.slotId === payload.slotId && target.wheelIndex === payload.wheelIndex) {
    return null
  }

  return {
    kind: 'move-wheel',
    fromSlotId: payload.slotId,
    fromWheelIndex: payload.wheelIndex,
    toSlotId: target.slotId,
    toWheelIndex: target.wheelIndex,
  }
}

function resolveTeamCovenantDndAction(
  payload: BuilderV2TeamCovenantDragPayload,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DndAction | null {
  if (target.kind === 'picker') {
    return {kind: 'remove-covenant', slotId: payload.slotId}
  }

  if (target.kind !== 'covenant' && target.kind !== 'slot' && target.kind !== 'wheel') {
    return null
  }

  if (target.slotId === payload.slotId) {
    return null
  }

  return {kind: 'move-covenant', fromSlotId: payload.slotId, toSlotId: target.slotId}
}

function resolveAwakenerEffectiveTarget(
  payload: Extract<BuilderV2DragPayload, {kind: 'awakener'}>,
  target: BuilderV2DropTargetDescriptor,
): BuilderV2DropTargetDescriptor | null {
  if (payload.source === 'team-management') {
    if (target.kind === 'picker') {
      return target
    }
    const slotTarget = getTeamManagementSlotTarget(target)
    if (!slotTarget) {
      return null
    }
    return slotTarget.teamId === payload.teamId && slotTarget.slotId === payload.slotId
      ? null
      : target
  }

  if (target.kind === 'picker') {
    return payload.source === 'team' ? target : null
  }

  if (payload.source === 'picker' && getTeamManagementSlotTarget(target)) {
    return target
  }

  const slotId = getSlotIdFromSlotOwnedTarget(target)
  if (!slotId) {
    return null
  }

  if (payload.source === 'team' && payload.slotId === slotId) {
    return null
  }

  return {kind: 'slot', slotId}
}

function resolveWheelEffectiveTarget(
  payload: Extract<BuilderV2DragPayload, {kind: 'wheel'}>,
  target: BuilderV2DropTargetDescriptor,
  slots: readonly BuilderV2SlotView[] | undefined,
): BuilderV2DropTargetDescriptor | null {
  if (target.kind === 'picker') {
    return payload.source === 'team' || payload.source === 'team-management' ? target : null
  }

  if (payload.source === 'picker' && getTeamManagementSlotTarget(target)) {
    return target
  }

  if (payload.source === 'team-management') {
    if (target.kind === 'team-management-wheel') {
      return payload.slotId === target.slotId &&
        payload.teamId === target.teamId &&
        payload.wheelIndex === target.wheelIndex
        ? null
        : target
    }

    return getTeamManagementSlotTarget(target) ? target : null
  }

  if (payload.source === 'picker' && target.kind === 'team-management-slot') {
    return target
  }

  if (target.kind === 'wheel') {
    if (slots && !findAwakenedSlot(slots, target.slotId)) {
      return null
    }
    if (
      payload.source === 'team' &&
      payload.slotId === target.slotId &&
      payload.wheelIndex === target.wheelIndex
    ) {
      return null
    }
    return target
  }

  const slotId = getSlotIdFromSlotOwnedTarget(target)
  if (!slotId) {
    return null
  }

  if (!slots) {
    return target
  }

  const wheelIndex = getFirstEmptyWheelSlotIndex(findAwakenedSlot(slots, slotId))
  return wheelIndex === null ? null : {kind: 'wheel', slotId, wheelIndex}
}

function resolveCovenantEffectiveTarget(
  payload: Extract<BuilderV2DragPayload, {kind: 'covenant'}>,
  target: BuilderV2DropTargetDescriptor,
  slots: readonly BuilderV2SlotView[] | undefined,
): BuilderV2DropTargetDescriptor | null {
  if (target.kind === 'picker') {
    return payload.source === 'team' || payload.source === 'team-management' ? target : null
  }

  if (payload.source === 'picker' && getTeamManagementSlotTarget(target)) {
    return target
  }

  if (payload.source === 'team-management') {
    const slotTarget = getTeamManagementSlotTarget(target)
    if (!slotTarget) {
      return null
    }

    return slotTarget.teamId === payload.teamId && slotTarget.slotId === payload.slotId
      ? null
      : target
  }

  if (payload.source === 'picker' && target.kind === 'team-management-slot') {
    return target
  }

  const slotId = getSlotIdFromSlotOwnedTarget(target)
  if (!slotId) {
    return null
  }

  if (payload.source === 'team' && payload.slotId === slotId) {
    return null
  }

  if (slots && !findAwakenedSlot(slots, slotId)) {
    return null
  }

  return {kind: 'covenant', slotId}
}

function resolveSlotOwnedTarget(
  target: BuilderV2DropTargetDescriptor,
  createAction: (slotId: string) => BuilderV2DndAction,
): BuilderV2DndAction | null {
  const slotId = getSlotIdFromSlotOwnedTarget(target)
  return slotId ? createAction(slotId) : null
}

function getSlotIdFromSlotOwnedTarget(target: BuilderV2DropTargetDescriptor): string | null {
  return target.kind === 'slot' || target.kind === 'wheel' || target.kind === 'covenant'
    ? target.slotId
    : null
}

function getTeamManagementSlotTarget(
  target: BuilderV2DropTargetDescriptor,
): {teamId: string; slotId: string} | null {
  switch (target.kind) {
    case 'team-management-slot':
    case 'team-management-wheel':
    case 'team-management-covenant':
      return {teamId: target.teamId, slotId: target.slotId}
    default:
      return null
  }
}

function getFirstEmptyWheelSlotIndex(slot: BuilderV2SlotView | undefined): WheelSlotIndex | null {
  if (!slot?.awakener) {
    return null
  }

  const firstEmptyIndex = slot.wheelSlots.findIndex((wheelSlot) => !wheelSlot.wheelId)
  return firstEmptyIndex === 0 || firstEmptyIndex === 1 ? firstEmptyIndex : null
}

function findAwakenedSlot(
  slots: readonly BuilderV2SlotView[],
  slotId: string,
): BuilderV2SlotView | undefined {
  return slots.find((slot) => slot.slotId === slotId && slot.awakener)
}

function parseWheelSlotIndex(value: string): WheelSlotIndex | null {
  if (value === '0') {
    return 0
  }
  if (value === '1') {
    return 1
  }
  return null
}

interface BaseDragPayloadInput {
  kind: BuilderV2DragKind
  id: string
  title: string
  subtitle: string | null
  imageSrc: string | undefined
  imageAlt: string
  variant?: BuilderV2DragPreviewDescriptor['variant']
  badges: BuilderV2DragPreviewBadge[]
}

type DragPayloadInput =
  | PickerDragPayloadInput
  | TeamAwakenerDragPayloadInput
  | TeamManagementSlotDragPayloadInput
  | TeamManagementWheelDragPayloadInput
  | TeamManagementCovenantDragPayloadInput
  | TeamWheelDragPayloadInput
  | TeamCovenantDragPayloadInput
  | TeamPosseDragPayloadInput

type PickerDragPayloadInput = BaseDragPayloadInput & {
  source: 'picker'
}

type TeamAwakenerDragPayloadInput = BaseDragPayloadInput & {
  kind: 'awakener'
  source: 'team'
  slotId: string
}

type TeamManagementSlotDragPayloadInput = BaseDragPayloadInput & {
  kind: 'awakener'
  source: 'team-management'
  teamId: string
  slotId: string
}

type TeamManagementWheelDragPayloadInput = BaseDragPayloadInput & {
  kind: 'wheel'
  source: 'team-management'
  teamId: string
  slotId: string
  wheelIndex: WheelSlotIndex
}

type TeamManagementCovenantDragPayloadInput = BaseDragPayloadInput & {
  kind: 'covenant'
  source: 'team-management'
  teamId: string
  slotId: string
}

type TeamWheelDragPayloadInput = BaseDragPayloadInput & {
  kind: 'wheel'
  source: 'team'
  slotId: string
  wheelIndex: WheelSlotIndex
}

type TeamCovenantDragPayloadInput = BaseDragPayloadInput & {
  kind: 'covenant'
  source: 'team'
  slotId: string
}

type TeamPosseDragPayloadInput = BaseDragPayloadInput & {
  kind: 'posse'
  source: 'team'
}

function createDragPayload(input: DragPayloadInput): BuilderV2DragPayload {
  const preview = {
    kind: input.kind,
    variant: input.variant ?? 'item',
    id: input.id,
    title: input.title,
    subtitle: input.subtitle,
    imageSrc: input.imageSrc,
    imageAlt: input.imageAlt,
    badges: input.badges,
  }

  switch (input.source) {
    case 'picker':
      return {kind: input.kind, source: 'picker', id: input.id, preview}
    case 'team-management':
      return createTeamManagementDragPayload(input, preview)
    case 'team':
      return createTeamDragPayload(input, preview)
  }
}

function createTeamManagementDragPayload(
  input:
    | TeamManagementSlotDragPayloadInput
    | TeamManagementWheelDragPayloadInput
    | TeamManagementCovenantDragPayloadInput,
  preview: BuilderV2DragPreviewDescriptor,
): BuilderV2DragPayload {
  switch (input.kind) {
    case 'awakener':
      return {
        kind: 'awakener',
        source: 'team-management',
        id: input.id,
        teamId: input.teamId,
        slotId: input.slotId,
        preview,
      }
    case 'wheel':
      return {
        kind: 'wheel',
        source: 'team-management',
        id: input.id,
        teamId: input.teamId,
        slotId: input.slotId,
        wheelIndex: input.wheelIndex,
        preview,
      }
    case 'covenant':
      return {
        kind: 'covenant',
        source: 'team-management',
        id: input.id,
        teamId: input.teamId,
        slotId: input.slotId,
        preview,
      }
  }
}

function createTeamDragPayload(
  input:
    | TeamAwakenerDragPayloadInput
    | TeamWheelDragPayloadInput
    | TeamCovenantDragPayloadInput
    | TeamPosseDragPayloadInput,
  preview: BuilderV2DragPreviewDescriptor,
): BuilderV2DragPayload {
  switch (input.kind) {
    case 'awakener':
      return {kind: 'awakener', source: 'team', id: input.id, slotId: input.slotId, preview}
    case 'wheel':
      return {
        kind: 'wheel',
        source: 'team',
        id: input.id,
        slotId: input.slotId,
        wheelIndex: input.wheelIndex,
        preview,
      }
    case 'covenant':
      return {kind: 'covenant', source: 'team', id: input.id, slotId: input.slotId, preview}
    case 'posse':
      return {kind: 'posse', source: 'team', id: input.id, preview}
  }
}

function createOwnershipBadges(owned: boolean): BuilderV2DragPreviewBadge[] {
  return owned ? [] : [{label: 'Unowned', tone: 'danger'}]
}

function createStatusBadges(label: string | null): BuilderV2DragPreviewBadge[] {
  return label ? [{label, tone: 'status'}] : []
}

function createSupportBadges(label: string | null): BuilderV2DragPreviewBadge[] {
  return label ? [{label, tone: 'support'}] : []
}

function createDangerBadges(label: string | null): BuilderV2DragPreviewBadge[] {
  return label ? [{label, tone: 'danger'}] : []
}

function createRecommendationBadges(label: string | null): BuilderV2DragPreviewBadge[] {
  return label ? [{label, tone: 'recommendation'}] : []
}

function isBuilderV2DragKind(value: unknown): value is BuilderV2DragKind {
  return value === 'awakener' || value === 'wheel' || value === 'covenant' || value === 'posse'
}

function isDragPreviewDescriptor(value: unknown): value is BuilderV2DragPreviewDescriptor {
  if (
    !isRecord(value) ||
    !isBuilderV2DragKind(value.kind) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.title !== 'string' ||
    (value.variant !== 'item' && value.variant !== 'slot') ||
    typeof value.imageAlt !== 'string'
  ) {
    return false
  }

  if (value.subtitle !== null && typeof value.subtitle !== 'string') {
    return false
  }

  if (value.imageSrc !== undefined && typeof value.imageSrc !== 'string') {
    return false
  }

  return Array.isArray(value.badges) && value.badges.every(isDragPreviewBadge)
}

function isDragPreviewBadge(value: unknown): value is BuilderV2DragPreviewBadge {
  return (
    isRecord(value) &&
    typeof value.label === 'string' &&
    (value.tone === 'danger' ||
      value.tone === 'quiet' ||
      value.tone === 'recommendation' ||
      value.tone === 'status' ||
      value.tone === 'support')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
