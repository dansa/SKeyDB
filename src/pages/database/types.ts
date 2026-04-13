export interface ModalGlowStop {
  position: string
  shape: 'circle' | 'ellipse'
  strength: number
  fade: number
  size?: string
}

export interface ModalGradientVariant {
  angle: number
  baseStrength: number
  vignetteStrength: number
  edgeGlowStrength: number
  glows: ModalGlowStop[]
}
