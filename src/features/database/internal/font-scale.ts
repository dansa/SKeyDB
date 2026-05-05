import {createElement, Fragment, type CSSProperties, type ReactNode} from 'react'

import type {DatabaseDetailFontScale} from '@/domain/database-detail-preferences'

export type FontScale = DatabaseDetailFontScale

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

export function getDescriptionFontScaleStyle(scale: FontScale): CSSProperties {
  return {'--desc-font-scale': String(FONT_SCALE_VALUES[scale])} as CSSProperties
}

export function scaledFontStyle(basePx: number): CSSProperties {
  return {fontSize: scaledPixelValue(basePx)}
}

export function scaledPixelValue(basePx: number): string {
  return `calc(var(--desc-font-scale, 1) * ${String(basePx)}px)`
}

export function scaledTypographyStyle(basePx: number, lineHeightPx?: number): CSSProperties {
  return {
    fontSize: scaledPixelValue(basePx),
    ...(lineHeightPx ? {lineHeight: scaledPixelValue(lineHeightPx)} : {}),
  }
}

export const getStarSize = (scale: FontScale) => {
  switch (scale) {
    case 'small':
      return {width: '20px', height: '20px', space: '-space-x-2.5', top: '5px'}
    case 'large':
      return {width: '28px', height: '28px', space: '-space-x-3.5', top: '7px'}
    case 'medium':
    default:
      return {width: '24px', height: '24px', space: '-space-x-3', top: '6px'}
  }
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
