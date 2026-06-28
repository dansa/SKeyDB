import derivedSkillsCatalogJson from '@/data/public-v3/catalogs/derived-skills.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const derivedSkillsCatalog = createPublicCatalogReader('derived-skills', derivedSkillsCatalogJson)

export const getPublicDerivedSkillCatalog = derivedSkillsCatalog.getCatalog
export const getPublicDerivedSkillCatalogRecords = derivedSkillsCatalog.getRecords
