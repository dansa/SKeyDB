import type {CSSProperties} from 'react'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import {
  brightenInteractiveTint,
  darkenInteractiveTint,
  DEFAULT_AWAKENER_OVERLAY_TEXT_COLOR,
  DESCRIPTION_ARG_TEXT_COLOR_BY_CHANNEL,
  getAwakenerTextColor,
  getAwakenerTextHoverColor,
  getAwakenerTextUnderlineColor,
} from '@/domain/awakeners-text-colors'
import {DEFAULT_REALM_ACCENT, REALM_ACCENT_BY_LABEL} from '@/domain/realms'

export interface DatabaseTintPalette {
  base: string
  underline: string
  hover: string
}

export const DATABASE_SECTION_TITLE_CLASS = 'ui-title px-4 pt-3 pb-2 text-amber-200/90'
export const DATABASE_ITEM_NAME_CLASS = 'text-amber-200/90'
export const DATABASE_ENTRY_TITLE_CLASS = 'ui-title text-sm text-amber-200/90'

export const DATABASE_INTERACTIVE_TOKEN_CLASS =
  'cursor-pointer select-text underline decoration-solid decoration-1 underline-offset-[1px] decoration-amber-200/35 text-amber-100/85 transition-colors hover:decoration-amber-100/60 hover:text-amber-50'

export const DATABASE_UNIMPLEMENTED_TOKEN_CLASS =
  'underline decoration-solid decoration-1 underline-offset-[1px] decoration-slate-500/50 text-slate-300/85'

export const DATABASE_SCALING_TOKEN_CLASS =
  'cursor-help underline decoration-solid decoration-1 underline-offset-[1px] decoration-amber-200/35 text-amber-100/85 transition-colors hover:decoration-amber-100/60 hover:text-amber-50'

export const DATABASE_SCALING_GROUP_CLASS =
  'cursor-help select-text text-amber-100/85 transition-colors hover:text-amber-50'

export const DATABASE_STAT_TOKEN_CLASS = 'text-slate-300/70'
export const DATABASE_POPOVER_STAT_TOKEN_CLASS = 'text-slate-300/65'
export const DATABASE_POPOVER_SCALING_TOKEN_CLASS = 'text-amber-100/80'
export const DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS =
  'cursor-help underline decoration-solid decoration-1 underline-offset-[1px] decoration-amber-200/35 text-amber-100/85 transition-colors hover:decoration-amber-100/60 hover:text-amber-50'
export const DATABASE_REFERENCE_TOKEN_CLASS =
  'select-text underline decoration-solid decoration-1 underline-offset-[1px] decoration-amber-200/35 text-amber-100/85'

export const DATABASE_TINTED_TOKEN_CLASS = 'database-tinted-token'

function buildTintPalette(base: string): DatabaseTintPalette {
  return {
    base,
    underline: darkenInteractiveTint(base),
    hover: brightenInteractiveTint(base),
  }
}

export function getDatabaseOverlayTint(
  overlay: Pick<AwakenerOverlayRecord, 'overlayType' | 'textColor'> | null | undefined,
): DatabaseTintPalette | null {
  if (!overlay || overlay.overlayType === 'realm') {
    return null
  }

  const colorName = overlay.textColor ?? DEFAULT_AWAKENER_OVERLAY_TEXT_COLOR
  return {
    base: getAwakenerTextColor(colorName),
    underline: getAwakenerTextUnderlineColor(colorName),
    hover: getAwakenerTextHoverColor(colorName),
  }
}

export function getDatabaseRealmTint(realmLabel: string): DatabaseTintPalette {
  return buildTintPalette(REALM_ACCENT_BY_LABEL[realmLabel] ?? DEFAULT_REALM_ACCENT)
}

export function getDatabaseDescriptionArgTint(
  channel: string | null | undefined,
): DatabaseTintPalette | null {
  if (!channel) {
    return null
  }

  const tintName = DESCRIPTION_ARG_TEXT_COLOR_BY_CHANNEL[channel]
  return tintName
    ? {
        base: getAwakenerTextColor(tintName),
        underline: getAwakenerTextUnderlineColor(tintName),
        hover: getAwakenerTextHoverColor(tintName),
      }
    : null
}

export function getDatabaseTintedTokenStyle(
  tint: DatabaseTintPalette | null | undefined,
): CSSProperties | undefined {
  if (!tint) {
    return undefined
  }

  return {
    '--database-token-color': tint.base,
    '--database-token-underline-color': tint.underline,
    '--database-token-hover-color': tint.hover,
  } as CSSProperties
}
