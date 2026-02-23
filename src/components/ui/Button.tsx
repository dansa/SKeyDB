import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'xs' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'border border-amber-300/70 bg-amber-500/15 text-amber-100 hover:border-amber-200/80 hover:bg-amber-500/22',
  secondary: 'border border-slate-500/60 bg-slate-900/70 text-slate-200 hover:border-amber-200/45',
  danger: 'border border-rose-300/70 bg-rose-500/12 text-rose-100 hover:border-rose-200/85 hover:bg-rose-500/18',
}

const sizeClassMap: Record<ButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
}

function joinClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

export function Button({ variant = 'secondary', size = 'xs', className, type = 'button', children, ...props }: ButtonProps) {
  return (
    <button
      className={joinClasses(
        variantClassMap[variant],
        sizeClassMap[size],
        'transition-colors disabled:opacity-50',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
