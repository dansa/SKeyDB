import type {Covenant} from './covenants'
import {searchPublicEntities} from './public-search'

export function searchCovenants(covenants: Covenant[], query: string): Covenant[] {
  return searchPublicEntities('covenants', covenants, query)
}
