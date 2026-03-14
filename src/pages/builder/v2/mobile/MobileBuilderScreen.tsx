import type {ReactNode} from 'react'

interface MobileBuilderScreenProps {
  children: ReactNode
  className?: string
  shellMode?: 'device' | 'preview'
  testId?: string
}

export function MobileBuilderScreen({
  children,
  className = '',
  shellMode = 'device',
  testId,
}: MobileBuilderScreenProps) {
  const heightClass = shellMode === 'preview' ? 'min-h-[100svh]' : 'h-[100svh] min-h-[100svh]'

  return (
    <div
      className={`flex ${heightClass} w-full flex-col bg-[#0c121c] ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  )
}
