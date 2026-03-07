import {DetailLevelSlider} from './DetailLevelSlider'

interface SkillLevelSliderProps {
  level: number
  onChange: (level: number) => void
}

export function SkillLevelSlider({level, onChange}: SkillLevelSliderProps) {
  return <DetailLevelSlider label='Skill Level' level={level} max={6} min={1} onChange={onChange} />
}
