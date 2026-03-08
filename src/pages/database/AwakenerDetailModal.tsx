import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {FaXmark} from 'react-icons/fa6'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
  resolveAwakenerStatsForLevel,
} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import {getAwakenerFullById, loadAwakenersFull, type AwakenerFull} from '@/domain/awakeners-full'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getCardNamesFromFull} from '@/domain/rich-text'

import {AwakenerBuildsTab} from './AwakenerBuildsTab'
import {AwakenerDetailCards} from './AwakenerDetailCards'
import {AwakenerDetailOverview} from './AwakenerDetailOverview'
import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {AwakenerTeamsTab} from './AwakenerTeamsTab'
import {
  FONT_SCALE_OPTIONS,
  FONT_SCALE_VALUES,
  readFontScale,
  writeFontScale,
  type FontScale,
} from './font-scale'
import {SkillLevelSlider} from './SkillLevelSlider'

interface AwakenerDetailModalProps {
  awakener: Awakener
  onClose: () => void
}

const TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'cards', label: 'Cards'},
  {id: 'builds', label: 'Builds'},
  {id: 'teams', label: 'Teams'},
] as const

type TabId = (typeof TABS)[number]['id']
const MOBILE_TAG_ROWS_HEIGHT = 46

export function AwakenerDetailModal({awakener, onClose}: AwakenerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [fullData, setFullData] = useState<AwakenerFull | null>(null)
  const [awakenerLevel, setAwakenerLevel] = useState(60)
  const [psycheSurgeOffset, setPsycheSurgeOffset] = useState(0)
  const [skillLevel, setSkillLevel] = useState(1)
  const [fontScale, setFontScaleRaw] = useState<FontScale>(readFontScale)
  const [showAllTags, setShowAllTags] = useState(false)
  const [canExpandTags, setCanExpandTags] = useState(false)
  const setFontScale = useCallback((fs: FontScale) => {
    setFontScaleRaw(fs)
    writeFontScale(fs)
  }, [])
  const panelRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)

  const cardNames = useMemo(() => {
    return fullData ? getCardNamesFromFull(fullData) : new Set<string>()
  }, [fullData])

  const resolvedStats = useMemo(() => {
    return fullData
      ? resolveAwakenerStatsForLevel(fullData, awakenerLevel, psycheSurgeOffset)
      : null
  }, [awakenerLevel, fullData, psycheSurgeOffset])

  const navigateToCards = useCallback(() => {
    setActiveTab('cards')
  }, [])

  const handleAwakenerLevelChange = useCallback((level: number) => {
    setAwakenerLevel(clampAwakenerDatabaseLevel(level))
  }, [])

  const handleIncreasePsycheSurge = useCallback(() => {
    setPsycheSurgeOffset((prev) => clampAwakenerDatabasePsycheSurgeOffset(prev + 1))
  }, [])

  const handleDecreasePsycheSurge = useCallback(() => {
    setPsycheSurgeOffset((prev) => clampAwakenerDatabasePsycheSurgeOffset(prev - 1))
  }, [])

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
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
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

  useEffect(() => {
    function refreshTagsOverflow() {
      const el = tagsRef.current
      if (!el) {
        setCanExpandTags(false)
        return
      }
      setCanExpandTags(el.scrollHeight > MOBILE_TAG_ROWS_HEIGHT + 1)
    }

    refreshTagsOverflow()
    window.addEventListener('resize', refreshTagsOverflow)
    return () => {
      window.removeEventListener('resize', refreshTagsOverflow)
    }
  }, [awakener.id, awakener.tags])

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target.closest('[data-skill-popover]')
      ) {
        onClose()
      }
    },
    [onClose],
  )

  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmTint = getRealmTint(awakener.realm)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const portrait = getAwakenerPortraitAsset(awakener.name)

  return (
    <div
      className='fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/65 p-4 md:p-6 lg:p-10'
      onClick={handleOverlayClick}
    >
      <div
        aria-label={`${displayName} details`}
        aria-modal='true'
        className='relative z-[901] flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border border-amber-200/55 bg-slate-950/[.97] shadow-[0_18px_50px_rgba(2,6,23,0.72)]'
        ref={panelRef}
        role='dialog'
      >
        <button
          aria-label='Close detail'
          className='absolute top-3 right-3 z-10 text-slate-400 transition-colors hover:text-amber-100'
          onClick={onClose}
          type='button'
        >
          <FaXmark className='h-4 w-4' />
        </button>

        <div className='flex min-h-0 flex-1'>
          <aside className='hidden w-56 shrink-0 overflow-y-auto border-r border-slate-700/40 p-4 md:block lg:w-64'>
            <AwakenerDetailSidebar
              awakener={awakener}
              enlightenOffset={psycheSurgeOffset}
              level={awakenerLevel}
              onDecreaseEnlighten={handleDecreasePsycheSurge}
              onIncreaseEnlighten={handleIncreasePsycheSurge}
              onLevelChange={handleAwakenerLevelChange}
              stats={resolvedStats}
              substatScaling={fullData?.substatScaling ?? null}
            />
          </aside>

          <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
            <div className='shrink-0 px-5 pt-4 pb-0'>
              {awakener.unreleased ? (
                <div className='mb-3 max-w-2xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
                  <p className='text-[11px] leading-relaxed text-amber-100/75'>
                    <strong className='font-semibold text-amber-200/90'>Pre-release data:</strong>{' '}
                    Values and content are based on pre-release information and may change before or
                    after release.
                  </p>
                </div>
              ) : null}
              <div className='flex items-center gap-2.5 pr-6'>
                <div className='h-11 w-11 shrink-0 overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 md:hidden'>
                  {portrait ? (
                    <img
                      alt=''
                      className='h-full w-full object-cover object-top'
                      draggable={false}
                      src={portrait}
                    />
                  ) : (
                    <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
                  )}
                </div>
                {realmIcon ? (
                  <img
                    alt=''
                    className='hidden h-11 w-11 shrink-0 md:block'
                    draggable={false}
                    src={realmIcon}
                  />
                ) : null}
                <div>
                  <h3 className='ui-title text-xl text-amber-100'>{displayName}</h3>
                  <p className='mt-0.5 text-xs text-slate-400'>
                    <span style={{color: realmTint}}>{realmLabel}</span>
                    <span className='mx-1.5 text-slate-600'>·</span>
                    <span>
                      {awakener.type
                        ? awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()
                        : '—'}
                    </span>
                    <span className='mx-1.5 text-slate-600'>·</span>
                    <span>{awakener.faction}</span>
                  </p>
                  {awakener.tags.length > 0 ? (
                    <div className='mt-1.5 max-w-xl'>
                      <div
                        className={`flex flex-wrap gap-1 overflow-hidden md:overflow-visible ${
                          showAllTags ? 'max-h-[18rem] md:max-h-none' : 'max-h-[46px] md:max-h-none'
                        }`}
                        ref={tagsRef}
                      >
                        {awakener.tags.map((tag) => (
                          <span
                            className='border border-slate-600/40 bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-400'
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {canExpandTags ? (
                        <button
                          aria-expanded={showAllTags}
                          className='mt-1 text-[10px] text-slate-500 transition-colors hover:text-slate-300 md:hidden'
                          onClick={() => {
                            setShowAllTags((prev) => !prev)
                          }}
                          type='button'
                        >
                          {showAllTags ? 'Show fewer tags' : 'Show all tags'}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className='mt-3 max-w-2xl'>
                <div className='flex items-center justify-between'>
                  <nav className='flex min-w-0 flex-wrap gap-0.5'>
                    {TABS.map((tab) => (
                      <button
                        className={`px-3.5 py-2 text-[11px] tracking-wide uppercase transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 border-amber-200/70 text-amber-100'
                            : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                        }}
                        type='button'
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                  <div className='hidden items-center gap-0.5 pr-1 md:flex'>
                    {FONT_SCALE_OPTIONS.map((fs) => (
                      <button
                        className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                          fontScale === fs.id
                            ? 'bg-slate-700/50 text-amber-100'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        key={fs.id}
                        onClick={() => {
                          setFontScale(fs.id)
                        }}
                        title={`Font size: ${fs.id}`}
                        type='button'
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className='mt-1 flex items-center gap-0.5 pr-1 md:hidden'>
                  {FONT_SCALE_OPTIONS.map((fs) => (
                    <button
                      className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                        fontScale === fs.id
                          ? 'bg-slate-700/50 text-amber-100'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      key={fs.id}
                      onClick={() => {
                        setFontScale(fs.id)
                      }}
                      title={`Font size: ${fs.id}`}
                      type='button'
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className='mt-0 h-px w-3/4 bg-slate-700/50' />
            </div>

            <div className='flex-1 overflow-y-auto p-5 pr-8 lg:pr-16'>
              <div className='mb-4 md:hidden'>
                <AwakenerDetailSidebar
                  awakener={awakener}
                  compact
                  enlightenOffset={psycheSurgeOffset}
                  level={awakenerLevel}
                  onDecreaseEnlighten={handleDecreasePsycheSurge}
                  onIncreaseEnlighten={handleIncreasePsycheSurge}
                  onLevelChange={handleAwakenerLevelChange}
                  stats={resolvedStats}
                  substatScaling={fullData?.substatScaling ?? null}
                />
              </div>

              <div className='max-w-2xl'>
                {activeTab === 'cards' && fullData ? (
                  <div className='sticky top-[-1.25rem] z-20 mb-4 border-b border-slate-700/35 bg-slate-950/90 pb-2 backdrop-blur-sm'>
                    <SkillLevelSlider level={skillLevel} onChange={setSkillLevel} />
                  </div>
                ) : null}
                {activeTab === 'overview' && (
                  <AwakenerDetailOverview
                    awakener={awakener}
                    cardNames={cardNames}
                    fullData={fullData}
                    onNavigateToCards={navigateToCards}
                    skillLevel={skillLevel}
                    stats={resolvedStats}
                  />
                )}
                {activeTab === 'cards' && (
                  <AwakenerDetailCards
                    cardNames={cardNames}
                    fullData={fullData}
                    skillLevel={skillLevel}
                    stats={resolvedStats}
                  />
                )}
                {activeTab === 'builds' && <AwakenerBuildsTab awakenerId={awakener.id} />}
                {activeTab === 'teams' && <AwakenerTeamsTab />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
