import talentsCatalogJson from '@/data/public-v3/catalogs/talents.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const talentsCatalog = createPublicCatalogReader('talents', talentsCatalogJson)

export const getPublicTalentCatalog = talentsCatalog.getCatalog
export const getPublicTalentCatalogRecords = talentsCatalog.getRecords
