import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {getRealmIcon, getRealmLabel} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {TABS, type TabId} from '@/pages/database/constants'

type AwakenerDetailModalHeaderProps = Readonly<{
  activeTab: TabId
  awakener: Awakener
  onTabChange: (tab: TabId) => void
  realmTint: string
}>

export function AwakenerDetailModalHeader({
  activeTab,
  awakener,
  onTabChange,
  realmTint,
}: AwakenerDetailModalHeaderProps) {
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const portrait = getAwakenerPortraitAsset(awakener.name)

  return (
    <div className='shrink-0 px-3 pt-5 pb-0'>
      {awakener.unreleased ? (
        <div className='mb-3 border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
          <p className='text-[11px] leading-relaxed text-amber-100/75'>
            <strong className='font-semibold text-amber-200/90'>Pre-release data:</strong> Values
            and content are based on pre-release information and may change before or after release.
          </p>
        </div>
      ) : null}

      <div className='flex flex-col lg:flex-row lg:items-end lg:justify-between'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <div className='h-14 w-14 shrink-0 overflow-hidden border border-slate-500/40 bg-linear-to-b from-slate-800 to-slate-900 lg:hidden'>
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

          <div className='min-w-0 flex-1 pb-2 lg:pb-2'>
            <div className='flex items-center gap-2 pr-28 lg:pr-0'>
              <h3 className='ui-title text-[1.85rem] leading-[1.1] text-slate-200 md:text-[2.5rem] lg:text-[2.8rem] lg:whitespace-nowrap'>
                {displayName}
              </h3>
            </div>
            <p className='mt-1 flex items-center text-[11px] tracking-[0.07em] text-slate-300 md:text-[14px] lg:mt-1.5 lg:text-[13px]'>
              {realmIcon ? (
                <img
                  alt=''
                  className='mr-2 h-5 w-5 shrink-0 md:mr-1.5 md:h-6 md:w-6 lg:h-7 lg:w-7'
                  draggable={false}
                  src={realmIcon}
                />
              ) : null}
              <span className='font-semibold uppercase' style={{color: realmTint}}>
                {realmLabel}
              </span>
              <span className='mx-1.5 font-bold text-slate-600 md:mx-2'>·</span>
              <span className='font-medium text-slate-200/90 uppercase'>
                {awakener.type
                  ? awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()
                  : '—'}
              </span>
              <span className='mx-1.5 font-bold text-slate-600 md:mx-2'>·</span>
              <span className='font-medium text-slate-200/80 uppercase'>{awakener.faction}</span>
            </p>
          </div>
        </div>

        <div className='relative mt-2 flex w-full justify-center lg:mt-0 lg:-mb-px lg:w-auto lg:justify-end'>
          <nav className='flex w-full min-w-0 flex-row justify-center gap-0.5 lg:w-auto lg:flex-none'>
            {TABS.map((tab) => (
              <button
                className={`flex-1 border-b-2 px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase transition-colors sm:px-3.5 sm:text-[11px] lg:px-6 lg:py-2.5 lg:text-[12px] ${
                  activeTab === tab.id
                    ? 'text-amber-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                }}
                style={activeTab === tab.id ? {borderColor: 'var(--modal-realm-tab)'} : undefined}
                type='button'
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div
        className='h-px w-full'
        style={{
          background:
            'linear-gradient(90deg, rgba(100, 116, 139, 0.18) 0%, rgba(100, 116, 139, 0.1) 52%, transparent 100%)',
        }}
      />
    </div>
  )
}
