import type {Awakener} from '@/domain/awakeners'

import {MODAL_GRADIENT_VARIANTS} from '../constants'
import type {ModalGradientVariant} from '../types'

export function getModalBackgroundVariantIndex(awakener: Awakener): number {
  const seed = `${String(awakener.id)}:${awakener.name}`
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash % MODAL_GRADIENT_VARIANTS.length
}

export function buildModalBackground(realmTint: string, variant: ModalGradientVariant): string {
  const glowLayers = variant.glows.map(
    (glow) =>
      `radial-gradient(${glow.size ?? 'auto'} at ${glow.position}, color-mix(in srgb, ${realmTint} ${String(
        glow.strength,
      )}%, transparent) 0%, transparent ${String(glow.fade)}%)`,
  )

  const edgeLayer = `radial-gradient(
    180% 140% at 50% -12%,
    color-mix(in srgb, ${realmTint} ${String(variant.edgeGlowStrength)}%, transparent) 0%,
    transparent 62%
  )`

  const vignetteLayer = `radial-gradient(
    140% 140% at 50% 50%,
    transparent 64%,
    color-mix(in srgb, #020617 ${String(variant.vignetteStrength)}%, transparent) 100%
  )`

  const baseLayer = `linear-gradient(
    ${String(variant.angle)}deg,
    color-mix(in srgb, ${realmTint} ${String(variant.baseStrength)}%, rgba(2, 6, 23, 0.982)) 0%,
    rgba(2, 6, 23, 0.975) 34%,
    rgba(2, 6, 23, 0.99) 100%
  )`

  return [edgeLayer, ...glowLayers, vignetteLayer, baseLayer].join(', ')
}
