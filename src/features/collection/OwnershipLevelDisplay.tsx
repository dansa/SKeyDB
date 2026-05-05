import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'

interface OwnershipLevelDisplayProps {
  ownedLevel: number | null
}

export function OwnershipLevelDisplay({ownedLevel}: OwnershipLevelDisplayProps) {
  return <DupeLevelDisplay level={ownedLevel} />
}
