import {resolveDatabaseReferenceInfoById} from '@/domain/database-reference-info'
import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import {resolveWheelMainstatValue} from '@/domain/wheel-mainstat-scaling'
import {buildWheelDatabaseReferenceLayer} from '@/domain/wheels-database-reference-layer'
import type {WheelFullV1Record} from '@/domain/wheels-full-v1'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

export function buildWheelPopoverEntry(wheelRecord: WheelFullV1Record): KeyedDatabaseReferenceEntry {
  const referenceLayer = buildWheelDatabaseReferenceLayer({
    activeDescriptionRank: 1,
    activeWheelId: wheelRecord.id,
  })
  const referenceInfo = resolveDatabaseReferenceInfoById(referenceLayer, wheelRecord.id)
  const mainstatLabel = getMainstatByKey(wheelRecord.mainstatKey)?.label ?? wheelRecord.mainstatKey

  if (!referenceInfo) {
    throw new Error(`Missing database reference info for wheel "${wheelRecord.id}".`)
  }

  return {
    key: `wheel:${wheelRecord.id}:preview`,
    name: referenceInfo.name,
    label: referenceInfo.label,
    description: referenceInfo.description,
    record: referenceInfo.record,
    descriptionRank: referenceInfo.descriptionRank,
    descriptionMaxRank: referenceInfo.descriptionMaxRank,
    attributeRows: [
      {
        iconSrc: getMainstatIcon(wheelRecord.mainstatKey),
        label: mainstatLabel,
        value: resolveWheelMainstatValue(wheelRecord.mainstatSeriesKey, 0),
      },
    ],
    navigationLabel: 'Open in Wheels DB',
    navigationTarget: {
      kind: 'wheel-page',
      wheelName: wheelRecord.name,
    },
    referenceLayerOverride: referenceLayer,
  }
}
