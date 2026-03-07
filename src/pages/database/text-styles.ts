import {DEFAULT_REALM_TINT, REALM_TINT_BY_LABEL} from '@/domain/factions'

export const DATABASE_SECTION_TITLE_CLASS = 'ui-title px-4 pt-3 pb-2 text-amber-200/90'
export const DATABASE_ITEM_NAME_CLASS = 'text-amber-200/90'
export const DATABASE_ENTRY_TITLE_CLASS = 'ui-title text-sm text-amber-200/90'

export const DATABASE_INTERACTIVE_TOKEN_CLASS =
  'cursor-pointer border-b border-dotted border-amber-200/35 text-amber-100/85 transition-colors hover:border-amber-100/60 hover:text-amber-50'

export const DATABASE_UNIMPLEMENTED_TOKEN_CLASS =
  'border-b border-dotted border-slate-500/50 text-slate-300/85'

export const DATABASE_SCALING_TOKEN_CLASS =
  'cursor-help border-b border-dotted border-amber-200/35 text-amber-100/85 transition-colors hover:border-amber-100/60 hover:text-amber-50'

export const DATABASE_STAT_TOKEN_CLASS = 'text-sky-300/90'
export const DATABASE_POPOVER_STAT_TOKEN_CLASS = 'text-sky-300/80'
export const DATABASE_POPOVER_SCALING_TOKEN_CLASS = 'text-amber-100/80'

export function getDatabaseRealmTint(realmLabel: string): string {
  return REALM_TINT_BY_LABEL[realmLabel] ?? DEFAULT_REALM_TINT
}
