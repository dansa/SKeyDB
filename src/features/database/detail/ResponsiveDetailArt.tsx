import type {ReactNode} from 'react'

interface ResponsiveDetailArtProps {
  children: ReactNode
  isMobileViewport: boolean
  viewport: 'desktop' | 'mobile'
}

export function ResponsiveDetailArt({
  children,
  isMobileViewport,
  viewport,
}: ResponsiveDetailArtProps) {
  const shouldRender = viewport === 'mobile' ? isMobileViewport : !isMobileViewport

  return shouldRender ? children : null
}
