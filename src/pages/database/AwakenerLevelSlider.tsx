import {DetailLevelSlider} from './DetailLevelSlider'

interface AwakenerLevelSliderProps {
  level: number
  onChange: (level: number) => void
}

export function AwakenerLevelSlider({level, onChange}: AwakenerLevelSliderProps) {
  return (
    <DetailLevelSlider
      compact
      label='Awakener Level'
      level={level}
      max={90}
      min={1}
      onChange={onChange}
    />
  )
}
