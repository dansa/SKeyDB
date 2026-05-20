import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'

import type {DatabaseDetailResultSet} from './database-detail-result-navigation'

export function createAwakenerDetailResultSet(
  awakeners: readonly Awakener[],
): DatabaseDetailResultSet {
  return {
    kind: 'awakener',
    items: awakeners.map((awakener) => ({
      id: awakener.id,
      imageSrc: getAwakenerPortraitAsset(awakener.name),
      name: formatAwakenerNameForUi(awakener.name),
    })),
  }
}

export function createWheelDetailResultSet(wheels: readonly Wheel[]): DatabaseDetailResultSet {
  return {
    kind: 'wheel',
    items: wheels.map((wheel) => ({
      id: wheel.id,
      imageSrc: getWheelAssetById(wheel.id),
      name: wheel.name,
    })),
  }
}

export function createPosseDetailResultSet(posses: readonly Posse[]): DatabaseDetailResultSet {
  return {
    kind: 'posse',
    items: posses.map((posse) => ({
      id: posse.id,
      imageSrc: getPosseAssetById(posse.id),
      imageTreatment: 'icon',
      name: posse.name,
    })),
  }
}

export function createCovenantDetailResultSet(
  covenants: readonly Covenant[],
): DatabaseDetailResultSet {
  return {
    kind: 'covenant',
    items: covenants.map((covenant) => ({
      id: covenant.id,
      imageSrc: getCovenantAssetById(covenant.id),
      imageTreatment: 'covenant-icon',
      name: covenant.name,
    })),
  }
}
