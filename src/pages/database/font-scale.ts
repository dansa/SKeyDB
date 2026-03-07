import {createElement, Fragment, type CSSProperties, type ReactNode} from 'react'

export type FontScale = 'small' | 'medium' | 'large'

export const FONT_SCALE_VALUES: Record<FontScale, number> = {
  small: 1,
  medium: 1.33,
  large: 1.67,
}

export const FONT_SCALE_OPTIONS: {id: FontScale; label: string}[] = [
  {id: 'small', label: 'S'},
  {id: 'medium', label: 'M'},
  {id: 'large', label: 'L'},
]

const STORAGE_KEY = 'modal-font-scale'

export function readFontScale(): FontScale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'small' || stored === 'medium' || stored === 'large') return stored
  return 'small'
}

export function writeFontScale(scale: FontScale): void {
  localStorage.setItem(STORAGE_KEY, scale)
}

export function scaledFontStyle(basePx: number): CSSProperties {
  return {fontSize: `calc(var(--desc-font-scale, 1) * ${String(basePx)}px)`}
}

export function renderTextWithBreaks(text: string): ReactNode {
  const parts = text.split('\n')
  return createElement(
    Fragment,
    null,
    ...parts.flatMap((part, i) =>
      i === 0
        ? [createElement('span', {key: String(i)}, part)]
        : [
            createElement('br', {key: `br${String(i)}`}),
            createElement('span', {key: String(i)}, part),
          ],
    ),
  )
}
