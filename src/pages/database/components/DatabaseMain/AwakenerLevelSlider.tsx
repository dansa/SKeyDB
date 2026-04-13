import {memo} from 'react'

import {DetailLevelSlider} from '../AwakenerDetail/Controls'

interface AwakenerLevelSliderProps {
  level: number
  onChange: (level: number) => void
}

export const AwakenerLevelSlider = memo(function AwakenerLevelSlider({
  level,
  onChange,
}: AwakenerLevelSliderProps) {
  return (
    <DetailLevelSlider
      compact
      label='Awakener Level'
      level={level}
      max={90}
      min={1}
      onChange={onChange}
      valuePrefix='Lv.'
    />
  )
})
