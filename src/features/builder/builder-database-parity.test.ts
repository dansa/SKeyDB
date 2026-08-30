import {describe, expect, it} from 'vitest'

import {getPublicAwakenerCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenersCatalog'
import {getPublicCovenantCatalogRecords} from '@/data-access/public-data/catalogScopes/covenantsCatalog'
import {getPublicPosseCatalogRecords} from '@/data-access/public-data/catalogScopes/possesCatalog'
import {getPublicWheelCatalogRecords} from '@/data-access/public-data/catalogScopes/wheelsCatalog'
import {getPublicBuilderCatalog} from '@/data-access/public-data/collectionRepository'
import {getAwakeners} from '@/domain/awakeners'
import {getCovenants} from '@/domain/covenants'
import {getEquippablePosses} from '@/domain/posses'
import {getWheels} from '@/domain/wheels'

function sortedIds(records: readonly {id: string}[]): string[] {
  return records.map((record) => record.id).toSorted()
}

describe('Builder database parity', () => {
  const databaseIds = {
    awakeners: sortedIds(getPublicAwakenerCatalogRecords()),
    wheels: sortedIds(getPublicWheelCatalogRecords()),
    covenants: sortedIds(getPublicCovenantCatalogRecords()),
    posses: sortedIds(getPublicPosseCatalogRecords().filter((posse) => posse.equippable !== false)),
  }

  const builderCatalog = getPublicBuilderCatalog()
  const builderAdapterIds = {
    awakeners: sortedIds(getAwakeners()),
    wheels: sortedIds(getWheels()),
    covenants: sortedIds(getCovenants()),
    posses: sortedIds(getEquippablePosses()),
  }

  const categories = [
    {key: 'awakeners', label: 'awakener'},
    {key: 'wheels', label: 'wheel'},
    {key: 'covenants', label: 'covenant'},
    {key: 'posses', label: 'equippable posse'},
  ] as const

  for (const {key, label} of categories) {
    it(`makes every database ${label} available to Builder`, () => {
      expect(builderCatalog.options[key].toSorted()).toEqual(databaseIds[key])
      expect(builderAdapterIds[key]).toEqual(databaseIds[key])
    })
  }
})
