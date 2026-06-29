import skillsCatalogJson from '@/data/public-v3/catalogs/skills.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const skillsCatalog = createPublicCatalogReader('skills', skillsCatalogJson)

export const getPublicSkillCatalog = skillsCatalog.getCatalog
export const getPublicSkillCatalogRecords = skillsCatalog.getRecords
