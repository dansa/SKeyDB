import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
import {getExaltValue, type AwakenerFullStats} from '@/domain/awakeners-full'
import {getColoredMainstatIcon} from '@/domain/mainstats'
import {DATABASE_POPOVER_CONTENT_FONT_SIZE} from '@/pages/database/utils/text-styles'

export type SkillType = 'command' | 'exalt' | 'talent' | 'enlighten'

interface SkillHeaderIconProps {
  skillType?: SkillType
  name: string
  isInteractive?: boolean
}

export function SkillHeaderIcon({skillType, name: _name, isInteractive}: SkillHeaderIconProps) {
  const isCommand = skillType === 'command'
  const isExalt = skillType === 'exalt'

  if (isCommand) {
    return (
      <img
        alt=''
        aria-hidden='true'
        className={`h-[1.4em] w-[1.4em] object-contain opacity-70 transition-opacity ${
          isInteractive ? 'group-hover:opacity-100' : ''
        }`}
        draggable={false}
        src={costIcon}
      />
    )
  }

  if (isExalt) {
    const aliemusIcon = getColoredMainstatIcon('ALIEMUS_REGEN')
    if (!aliemusIcon) return null
    return (
      <img
        alt=''
        aria-hidden='true'
        className={`h-[1.2em] w-[1.2em] object-contain opacity-80 transition-opacity ${
          isInteractive ? 'group-hover:opacity-100' : ''
        }`}
        draggable={false}
        src={aliemusIcon}
      />
    )
  }

  return null
}

interface SkillHeaderValueProps {
  skillType?: SkillType
  cost?: string
  label: string
  name: string
  stats: AwakenerFullStats | null
  isInteractive?: boolean
}

export function SkillHeaderValue({
  skillType,
  cost,
  label,
  name,
  stats,
  isInteractive,
}: SkillHeaderValueProps) {
  const isCommand = skillType === 'command'
  const isExalt = skillType === 'exalt'

  if (isCommand) {
    return (
      <span
        className={`font-semibold text-[#ededed] transition-colors ${
          isInteractive ? 'group-hover:text-amber-100' : ''
        }`}
        style={{fontSize: DATABASE_POPOVER_CONTENT_FONT_SIZE}}
      >
        {cost ?? label}
      </span>
    )
  }

  if (isExalt) {
    const exaltValue = getExaltValue(name, stats)
    return (
      <span
        className={`font-semibold text-amber-200/90 transition-colors ${
          isInteractive ? 'group-hover:text-amber-100' : ''
        }`}
        style={{fontSize: DATABASE_POPOVER_CONTENT_FONT_SIZE}}
      >
        {exaltValue}
      </span>
    )
  }

  return (
    <span
      className='shrink-0 text-slate-500 italic'
      style={{fontSize: 'calc(var(--desc-font-scale, 1) * 11px)'}}
    >
      {label}
    </span>
  )
}
