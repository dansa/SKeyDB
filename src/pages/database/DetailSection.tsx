import type { ReactNode } from 'react'
import { scaledFontStyle } from './font-scale'

export type DetailSectionItem = {
  key: string
  label: string
  name: string
  description: string
}

type DetailSectionProps = {
  title: string
  items: DetailSectionItem[]
  emptyMessage?: string
  children?: ReactNode
  renderDescription?: (description: string) => ReactNode
}

export function DetailSection({ title, items, emptyMessage, children, renderDescription }: DetailSectionProps) {
  return (
    <div className="border border-slate-600/30 bg-slate-900/30">
      <h4
        className="ui-title px-4 pt-3 pb-2 text-amber-100"
        style={scaledFontStyle(14)}
      >{title}</h4>

      {items.length === 0 && !children ? (
        <p className="px-4 pb-3 text-xs text-slate-400">{emptyMessage ?? 'No data available.'}</p>
      ) : (
        <div>
          {items.map((item, index) => (
            <div key={item.key}>
              {index > 0 ? (
                <div className="mx-4 h-px bg-gradient-to-r from-slate-600/50 via-slate-600/20 to-transparent" />
              ) : null}
              <div className="px-4 py-2.5">
                <p
                  className="text-slate-300"
                  style={scaledFontStyle(12)}
                >
                  <span className="text-slate-500">{item.label}</span>
                  <span className="mx-1.5 text-slate-600">·</span>
                  <span className="text-amber-100/85">{item.name}</span>
                </p>
                <p
                  className="mt-1 leading-relaxed text-slate-400"
                  style={scaledFontStyle(12)}
                >
                  {renderDescription ? renderDescription(item.description) : item.description}
                </p>
              </div>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
