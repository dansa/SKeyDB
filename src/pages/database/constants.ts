import type {ModalGradientVariant} from './types'

export const TABS = [
  {id: 'cards', label: 'Skills'},
  {id: 'copies', label: 'Copies'},
  {id: 'talents', label: 'Talents'},
  {id: 'builds', label: 'Builds'},
  {id: 'teams', label: 'Teams'},
] as const

export type TabId = (typeof TABS)[number]['id']

export const MODAL_GRADIENT_VARIANTS: ModalGradientVariant[] = [
  {
    angle: 185,
    baseStrength: 5,
    vignetteStrength: 7,
    edgeGlowStrength: 7,
    glows: [
      {position: '12% 14%', shape: 'circle', strength: 7, fade: 58, size: '68% 68%'},
      {position: '84% 12%', shape: 'circle', strength: 5, fade: 52, size: '62% 62%'},
      {position: '56% 100%', shape: 'ellipse', strength: 5, fade: 66, size: '92% 42%'},
      {position: '38% 46%', shape: 'ellipse', strength: 3, fade: 54, size: '56% 34%'},
    ],
  },
  {
    angle: 158,
    baseStrength: 5,
    vignetteStrength: 7,
    edgeGlowStrength: 8,
    glows: [
      {position: '18% 12%', shape: 'ellipse', strength: 8, fade: 60, size: '78% 48%'},
      {position: '88% 18%', shape: 'circle', strength: 6, fade: 52, size: '58% 58%'},
      {position: '46% 76%', shape: 'ellipse', strength: 5, fade: 62, size: '82% 44%'},
      {position: '72% 54%', shape: 'circle', strength: 3, fade: 48, size: '42% 42%'},
    ],
  },
  {
    angle: 176,
    baseStrength: 5,
    vignetteStrength: 8,
    edgeGlowStrength: 8,
    glows: [
      {position: 'top left', shape: 'ellipse', strength: 7, fade: 62, size: '74% 44%'},
      {position: '74% 10%', shape: 'ellipse', strength: 6, fade: 52, size: '60% 34%'},
      {position: '54% 100%', shape: 'ellipse', strength: 6, fade: 66, size: '88% 40%'},
      {position: '18% 72%', shape: 'circle', strength: 3, fade: 50, size: '40% 40%'},
    ],
  },
]
