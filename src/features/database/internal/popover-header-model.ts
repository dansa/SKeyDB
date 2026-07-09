import type {CSSProperties, ReactNode} from 'react'

export interface PopoverHeaderModel {
  title: ReactNode
  icon?: ReactNode
  eyebrow?: ReactNode
  eyebrowClassName?: string
  eyebrowStyle?: CSSProperties
  titleClassName?: string
  titleStyle?: CSSProperties
  accent?: ReactNode
  accentClassName?: string
  accentStyle?: CSSProperties
  action?: {
    label: string
    title?: string
    onClick: () => void
  }
}
