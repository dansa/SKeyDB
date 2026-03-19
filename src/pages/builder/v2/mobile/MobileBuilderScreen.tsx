import type {HTMLAttributes, ReactNode} from 'react'

interface MobileBuilderScreenProps extends HTMLAttributes<HTMLDivElement> {
  allowPageOverflow?: boolean
  children: ReactNode
  className?: string
  testId?: string
}

export function MobileBuilderScreen({
  allowPageOverflow = false,
  children,
  className = '',
  testId,
  ...rest
}: MobileBuilderScreenProps) {
  const heightClass = allowPageOverflow ? 'min-h-[100svh]' : 'h-[100svh] min-h-[100svh]'

  return (
    <div
      className={`flex ${heightClass} w-full flex-col bg-[#0c121c] ${className}`.trim()}
      data-builder-main-zone='true'
      data-mobile-builder-snap-target='true'
      data-testid={testId}
      {...rest}
    >
      {children}
    </div>
  )
}
