interface TimelineSectionHeaderProps {
  title: string
}

const TIMELINE_SECTION_DIVIDER_CLASS =
  'bg-linear-to-r from-amber-200/20 via-slate-500/25 to-transparent'

export function TimelineSectionHeader({title}: TimelineSectionHeaderProps) {
  return (
    <div className='flex items-center gap-3'>
      <h3 className='ui-title text-sm text-slate-400'>{title}</h3>
      <div className={`h-px flex-1 ${TIMELINE_SECTION_DIVIDER_CLASS}`} />
    </div>
  )
}
