import type {HTMLAttributes} from 'react'

function joinClassNames(...parts: (string | undefined | false | null)[]) {
  return parts.filter(Boolean).join(' ')
}

type SigilVariant = 'card' | 'thumb' | 'wheel'

export function BuilderSigilPlaceholder({
  className,
  noPlus = false,
  variant,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  noPlus?: boolean
  variant: SigilVariant
}) {
  const variantClassName =
    variant === 'card'
      ? 'sigil-placeholder-card'
      : variant === 'wheel'
        ? 'sigil-placeholder-wheel'
        : 'sigil-placeholder-thumb'

  return (
    <span
      className={joinClassNames(
        'sigil-placeholder',
        variantClassName,
        noPlus ? 'sigil-placeholder-no-plus' : '',
        className,
      )}
      {...rest}
    />
  )
}

export function BuilderCovenantPlaceholder({className, ...rest}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames('relative block h-full w-full overflow-hidden', className)}
      {...rest}
    >
      <BuilderSigilPlaceholder className='absolute inset-0' variant='thumb' />
    </span>
  )
}
