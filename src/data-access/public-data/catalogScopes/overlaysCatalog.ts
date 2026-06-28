import overlaysCatalogJson from '@/data/public-v3/catalogs/overlays.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const overlaysCatalog = createPublicCatalogReader('overlays', overlaysCatalogJson)

export const getPublicOverlayCatalog = overlaysCatalog.getCatalog
export const getPublicOverlayCatalogRecords = overlaysCatalog.getRecords
