import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import type {Posse} from '@/domain/posses'
import type {Relic} from '@/domain/relics'
import type {Wheel} from '@/domain/wheels'

import type {DatabaseDetailResultSet} from './database-detail-result-navigation'
import {createDatabaseDetailResultSet} from './dbDetailRegistry'

export function createAwakenerDetailResultSet(
  awakeners: readonly Awakener[],
): DatabaseDetailResultSet {
  return createDatabaseDetailResultSet('awakener', awakeners)
}

export function createWheelDetailResultSet(wheels: readonly Wheel[]): DatabaseDetailResultSet {
  return createDatabaseDetailResultSet('wheel', wheels)
}

export function createPosseDetailResultSet(posses: readonly Posse[]): DatabaseDetailResultSet {
  return createDatabaseDetailResultSet('posse', posses)
}

export function createCovenantDetailResultSet(
  covenants: readonly Covenant[],
): DatabaseDetailResultSet {
  return createDatabaseDetailResultSet('covenant', covenants)
}

export function createRelicDetailResultSet(relics: readonly Relic[]): DatabaseDetailResultSet {
  return createDatabaseDetailResultSet('relic', relics)
}
