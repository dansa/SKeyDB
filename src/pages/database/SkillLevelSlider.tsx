type SkillLevelSliderProps = {
  level: number
  onChange: (level: number) => void
}

export function SkillLevelSlider({ level, onChange }: SkillLevelSliderProps) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
        <span>Skill Level</span>
        <span className="rounded border border-slate-500/55 bg-slate-950/80 px-1.5 py-0.5 font-mono text-[11px] text-slate-200 normal-case tracking-normal">
          Lv. {level}
        </span>
      </span>
      <input
        className="export-box-slider"
        max={6}
        min={1}
        onChange={(e) => onChange(Number(e.target.value))}
        step={1}
        type="range"
        value={level}
      />
    </label>
  )
}
