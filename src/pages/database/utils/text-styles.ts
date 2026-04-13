import {DEFAULT_REALM_TINT, REALM_TINT_BY_LABEL} from '@/domain/factions'

export const DATABASE_SECTION_TITLE_CLASS = 'ui-title px-4 pt-3 pb-2 text-slate-200'
export const DATABASE_ITEM_NAME_CLASS = 'font-semibold text-amber-200/90 leading-tight'
export const DATABASE_ENTRY_TITLE_CLASS =
  'text-base font-semibold tracking-wide text-amber-200/90 leading-tight'
export const DATABASE_POPOVER_SHELL_CLASS =
  'w-max max-w-[320px] border border-white/[0.07] bg-slate-950/96 shadow-none'
export const DATABASE_POPOVER_HEADER_CLASS = 'mb-2.5 pl-2 flex items-start justify-between gap-5'
export const DATABASE_POPOVER_DIVIDER_CLASS =
  'mb-2 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent'
export const DATABASE_POPOVER_SURFACE_STYLE = {} as const
export const DATABASE_INLINE_TOKEN_BUTTON_STYLE = {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  letterSpacing: 'inherit',
} as const

export const DATABASE_INTERACTIVE_TOKEN_CLASS =
  'db-dash-underline db-dash-underline-hover cursor-pointer text-amber-200/90 [--db-dash-strength:26%] [--db-dash-hover-strength:40%] transition-[color,filter] duration-140 hover:text-amber-50 hover:brightness-110 outline-none'

export const DATABASE_UNIMPLEMENTED_TOKEN_CLASS =
  'db-dash-underline text-slate-300/85 [--db-dash-strength:24%]'

export const DATABASE_SCALING_TOKEN_CLASS =
  'db-dash-underline db-dash-underline-hover cursor-help text-amber-200/90 [--db-dash-strength:24%] [--db-dash-hover-strength:36%] hover:text-amber-50 outline-none'

export const DATABASE_STAT_TOKEN_CLASS = 'text-amber-200/90'
export const DATABASE_POPOVER_STAT_TOKEN_CLASS = 'text-amber-200/90'
export const DATABASE_POPOVER_SCALING_TOKEN_CLASS = 'text-amber-200/90'

export function getDatabaseRealmTint(realmLabel: string): string {
  return REALM_TINT_BY_LABEL[realmLabel] ?? DEFAULT_REALM_TINT
}
