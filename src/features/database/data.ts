import {getAwakeners} from '@/domain/awakeners'
import {getCovenants} from '@/domain/covenants'
import {getPosses} from '@/domain/posses'
import {getWheels} from '@/domain/wheels'

export const databaseAwakeners = getAwakeners()
export const databaseWheels = getWheels()
export const databasePosses = getPosses()
export const databaseCovenants = getCovenants()
