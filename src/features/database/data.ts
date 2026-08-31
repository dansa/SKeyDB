import {getAwakeners} from '@/domain/awakeners'
import {getCovenants} from '@/domain/covenants'
import {getOrisons} from '@/domain/orisons'
import {getPosses} from '@/domain/posses'
import {getRelics} from '@/domain/relics'
import {getWheels} from '@/domain/wheels'

export const databaseAwakeners = getAwakeners()
export const databaseWheels = getWheels()
export const databasePosses = getPosses()
export const databaseOrisons = getOrisons()
export const databaseCovenants = getCovenants()
export const databaseRelics = getRelics()
