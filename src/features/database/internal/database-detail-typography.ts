import type {CSSProperties} from 'react'

import {scaledFontStyle, scaledPixelValue, scaledTypographyStyle} from './font-scale'

export const DATABASE_DETAIL_HEADER_TITLE_CLASS = 'ui-title text-xl text-amber-100'
export const DATABASE_DETAIL_HEADER_META_CLASS = 'mt-0.5 text-xs text-slate-400'
export const DATABASE_DETAIL_META_ROW_CLASS =
  'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 uppercase text-slate-500'
export const DATABASE_DETAIL_META_PRIMARY_CLASS = 'text-amber-100/90'
export const DATABASE_DETAIL_META_SEPARATOR_CLASS = 'text-slate-700'
export const DATABASE_DETAIL_META_LINK_CLASS =
  'cursor-pointer tracking-normal text-amber-100 normal-case transition-colors hover:text-amber-50'
export const DATABASE_DETAIL_SECTION_HEADING_CLASS = 'ui-title text-amber-200/88 uppercase'
export const DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS = 'ui-title text-slate-400 uppercase'
export const DATABASE_DETAIL_BODY_CLASS = 'leading-relaxed text-slate-400'
export const DATABASE_DETAIL_BODY_STRONG_CLASS = 'text-slate-300'
export const DATABASE_DETAIL_VALUE_ROW_CLASS =
  'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-slate-300'
export const DATABASE_DETAIL_VALUE_LABEL_CLASS = 'font-["Droid_Serif"] text-slate-200'
export const DATABASE_DETAIL_VALUE_CLASS = 'font-["Droid_Serif"] text-amber-100'
export const DATABASE_DETAIL_FIXED_UTILITY_ACTION_CLASS =
  'text-[11px] tracking-[0.18em] uppercase transition-colors'

export function getDatabaseDetailSectionHeadingStyle(): CSSProperties {
  return {
    ...scaledTypographyStyle(11, 14),
    letterSpacing: '0.22em',
  }
}

export function getDatabaseDetailBodyStyle(): CSSProperties {
  return scaledTypographyStyle(12, 20)
}

export function getDatabaseDetailValueStyle(): CSSProperties {
  return scaledTypographyStyle(16, 20)
}

export function getDatabaseDetailLoreStyle(): CSSProperties {
  return scaledTypographyStyle(12, 20)
}

export function getDatabaseDetailLorePreviewHeight(previewLineCount: number): string {
  return `calc(${String(previewLineCount)} * ${scaledPixelValue(20)})`
}

export function getDatabaseDetailBodyTextStyle(): CSSProperties {
  return scaledFontStyle(12)
}
