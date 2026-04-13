import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {resolveAwakenerStatsForLevel} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import {getAwakenerFullById, loadAwakenersFull, type AwakenerFull} from '@/domain/awakeners-full'
import {getRealmTint} from '@/domain/factions'
import {getCardNamesFromFull} from '@/domain/rich-text'
import {MODAL_GRADIENT_VARIANTS, type TabId} from '@/pages/database/constants'
import {FONT_SCALE_VALUES, type FontScale} from '@/pages/database/utils/font-scale'
import {
  buildModalBackground,
  getModalBackgroundVariantIndex,
} from '@/pages/database/utils/modal-background'

import {useAwakenerDetailModalStore} from '../State'
import {AwakenerDetailModalHeader} from './AwakenerDetailModalHeader'
import {AwakenerDetailModalTabContent} from './AwakenerDetailModalTabContent'
import {AwakenerDetailModalTopbar} from './AwakenerDetailModalTopbar'
import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'

type AwakenerDetailModalProps = Readonly<{
  awakener: Awakener
  onClose: () => void
  initialTab?: TabId
  onTabChange?: (tab: TabId) => void
}>

export function AwakenerDetailModal({
  awakener,
  onClose,
  initialTab,
  onTabChange,
}: AwakenerDetailModalProps) {
  const [fullData, setFullData] = useState<AwakenerFull | null>(null)
  const internalActiveTab = useAwakenerDetailModalStore((state) => state.activeTab)
  const awakenerLevel = useAwakenerDetailModalStore((state) => state.awakenerLevel)
  const psycheSurgeOffset = useAwakenerDetailModalStore((state) => state.psycheSurgeOffset)
  const skillLevel = useAwakenerDetailModalStore((state) => state.skillLevel)
  const fontScale = useAwakenerDetailModalStore((state) => state.fontScale)
  const isScalingMenuOpen = useAwakenerDetailModalStore((state) => state.isScalingMenuOpen)
  const isTagsMenuOpen = useAwakenerDetailModalStore((state) => state.isTagsMenuOpen)
  const initializeModalState = useAwakenerDetailModalStore((state) => state.initialize)
  const setInternalActiveTab = useAwakenerDetailModalStore((state) => state.setActiveTab)
  const setAwakenerLevel = useAwakenerDetailModalStore((state) => state.setAwakenerLevel)
  const setPsycheSurgeOffset = useAwakenerDetailModalStore((state) => state.setPsycheSurgeOffset)
  const setSkillLevel = useAwakenerDetailModalStore((state) => state.setSkillLevel)
  const setFontScale = useAwakenerDetailModalStore((state) => state.setFontScale)
  const toggleScalingMenu = useAwakenerDetailModalStore((state) => state.toggleScalingMenu)
  const toggleTagsMenu = useAwakenerDetailModalStore((state) => state.toggleTagsMenu)
  const closeScalingMenu = useAwakenerDetailModalStore((state) => state.closeScalingMenu)
  const closeTagsMenu = useAwakenerDetailModalStore((state) => state.closeTagsMenu)
  const scalingMenuRef = useRef<HTMLDivElement>(null)
  const tagsMenuRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    initializeModalState(awakener.id)
  }, [awakener.id, initializeModalState])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scalingMenuRef.current && !scalingMenuRef.current.contains(event.target as Node)) {
        closeScalingMenu()
      }
      if (tagsMenuRef.current && !tagsMenuRef.current.contains(event.target as Node)) {
        closeTagsMenu()
      }
    }

    if (isScalingMenuOpen || isTagsMenuOpen) {
      globalThis.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      globalThis.removeEventListener('mousedown', handleClickOutside)
    }
  }, [closeScalingMenu, closeTagsMenu, isScalingMenuOpen, isTagsMenuOpen])

  useEffect(() => {
    let cancelled = false

    void loadAwakenersFull()
      .then((data) => {
        if (!cancelled) {
          setFullData(getAwakenerFullById(awakener.id, data) ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFullData(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [awakener.id])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    globalThis.addEventListener('keydown', handleEscape)
    return () => {
      globalThis.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--desc-font-scale',
      String(FONT_SCALE_VALUES[fontScale]),
    )

    return () => {
      document.documentElement.style.removeProperty('--desc-font-scale')
    }
  }, [fontScale])

  const backgroundVariant = useMemo(() => getModalBackgroundVariantIndex(awakener), [awakener])
  const cardNames = useMemo(() => {
    return fullData ? getCardNamesFromFull(fullData) : new Set<string>()
  }, [fullData])
  const resolvedStats = useMemo(() => {
    return fullData
      ? resolveAwakenerStatsForLevel(fullData, awakenerLevel, psycheSurgeOffset)
      : null
  }, [awakenerLevel, fullData, psycheSurgeOffset])
  const activeTab = initialTab ?? internalActiveTab
  const realmTint = getRealmTint(awakener.realm)
  const backgroundByVariant = useMemo(() => {
    return buildModalBackground(
      realmTint,
      MODAL_GRADIENT_VARIANTS[backgroundVariant] ?? MODAL_GRADIENT_VARIANTS[0],
    )
  }, [backgroundVariant, realmTint])
  const modalChromeStyle = useMemo(
    () =>
      ({
        '--modal-realm-tint': realmTint,
        '--modal-realm-border': `color-mix(in srgb, ${realmTint} 88%, #f6d28b)`,
        '--modal-realm-border-bottom': `color-mix(in srgb, ${realmTint} 42%, #1e293b)`,
        '--modal-realm-border-soft': `color-mix(in srgb, ${realmTint} 54%, rgba(148, 163, 184, 0.55))`,
        '--modal-realm-tab': `color-mix(in srgb, ${realmTint} 84%, #f8e3aa)`,
        background: backgroundByVariant,
        borderColor: 'var(--modal-realm-border)',
        borderImageSlice: 1,
        borderImageSource:
          'linear-gradient(180deg, var(--modal-realm-border) 0%, color-mix(in srgb, var(--modal-realm-border) 84%, var(--modal-realm-border-bottom)) 24%, color-mix(in srgb, var(--modal-realm-border) 56%, var(--modal-realm-border-bottom)) 62%, var(--modal-realm-border-bottom) 100%)',
        boxShadow: `
          0 22px 64px rgba(2, 6, 23, 0.78),
          0 0 0 1px color-mix(in srgb, ${realmTint} 34%, transparent),
          inset 0 1px 0 color-mix(in srgb, ${realmTint} 28%, rgba(255,255,255,0.06))
        `,
      }) as React.CSSProperties,
    [backgroundByVariant, realmTint],
  )

  const setActiveTab = useCallback(
    (nextTab: TabId) => {
      if (initialTab === undefined) {
        setInternalActiveTab(nextTab)
      }
      onTabChange?.(nextTab)
    },
    [initialTab, onTabChange, setInternalActiveTab],
  )

  const navigateToCards = useCallback(() => {
    setActiveTab('cards')
  }, [setActiveTab])

  const handleAwakenerLevelChange = useCallback(
    (level: number) => {
      setAwakenerLevel(level)
    },
    [setAwakenerLevel],
  )

  const handlePsycheSurgeChange = useCallback(
    (offset: number) => {
      setPsycheSurgeOffset(offset)
    },
    [setPsycheSurgeOffset],
  )

  const handleFontScaleChange = useCallback(
    (nextFontScale: FontScale) => {
      setFontScale(nextFontScale)
    },
    [setFontScale],
  )

  return (
    <div className='fixed inset-0 z-900 flex items-center justify-center bg-slate-950/65 p-4 md:p-6 lg:p-10'>
      <button
        aria-label='Close detail overlay'
        className='absolute inset-0'
        onClick={onClose}
        type='button'
      />
      <dialog
        aria-label={`${awakener.name} details`}
        className='relative z-901 flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border bg-slate-950/97'
        open
        ref={panelRef}
        style={modalChromeStyle}
      >
        <AwakenerDetailModalTopbar
          fontScale={fontScale}
          isScalingMenuOpen={isScalingMenuOpen}
          isTagsMenuOpen={isTagsMenuOpen}
          onClose={onClose}
          onCloseScalingMenu={closeScalingMenu}
          onCloseTagsMenu={closeTagsMenu}
          onFontScaleChange={handleFontScaleChange}
          onToggleScalingMenu={toggleScalingMenu}
          onToggleTagsMenu={toggleTagsMenu}
          scalingMenuRef={scalingMenuRef}
          tags={awakener.tags}
          tagsMenuRef={tagsMenuRef}
        />

        <div className='flex min-h-0 flex-1'>
          <aside className='database-scrollbar hidden h-full w-56 shrink-0 overflow-y-auto py-4 pr-2 pl-4 md:block lg:w-64'>
            <AwakenerDetailSidebar
              awakener={awakener}
              enlightenOffset={psycheSurgeOffset}
              level={awakenerLevel}
              onLevelChange={handleAwakenerLevelChange}
              onPsycheSurgeChange={handlePsycheSurgeChange}
              onSkillLevelChange={setSkillLevel}
              realmTint={realmTint}
              scalingPreviewSource={fullData}
              skillLevel={skillLevel}
              statScaling={fullData?.statScaling ?? null}
              stats={resolvedStats}
              substatScaling={fullData?.substatScaling ?? null}
            />
          </aside>

          <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
            <AwakenerDetailModalHeader
              activeTab={activeTab}
              awakener={awakener}
              onTabChange={setActiveTab}
              realmTint={realmTint}
            />

            <div className='database-scrollbar flex-1 overflow-y-auto px-3 pt-3 pr-3 pb-4 lg:pr-4'>
              <div className='mb-4 md:hidden'>
                <AwakenerDetailSidebar
                  awakener={awakener}
                  compact
                  enlightenOffset={psycheSurgeOffset}
                  level={awakenerLevel}
                  onLevelChange={handleAwakenerLevelChange}
                  onPsycheSurgeChange={handlePsycheSurgeChange}
                  onSkillLevelChange={setSkillLevel}
                  realmTint={realmTint}
                  scalingPreviewSource={fullData}
                  skillLevel={skillLevel}
                  statScaling={fullData?.statScaling ?? null}
                  stats={resolvedStats}
                  substatScaling={fullData?.substatScaling ?? null}
                />
              </div>

              <AwakenerDetailModalTabContent
                activeTab={activeTab}
                awakener={awakener}
                cardNames={cardNames}
                fontScale={fontScale}
                fullData={fullData}
                onNavigateToCards={navigateToCards}
                realmTint={realmTint}
                skillLevel={skillLevel}
                stats={resolvedStats}
              />
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
