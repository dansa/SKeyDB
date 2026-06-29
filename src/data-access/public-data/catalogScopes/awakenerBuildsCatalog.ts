import awakenerBuildsCatalogJson from '@/data/public-v3/catalogs/awakener-builds.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const awakenerBuildsCatalog = createPublicCatalogReader(
  'awakener-builds',
  awakenerBuildsCatalogJson,
)

export const getPublicAwakenerBuildCatalog = awakenerBuildsCatalog.getCatalog
export const getPublicAwakenerBuildCatalogRecords = awakenerBuildsCatalog.getRecords
