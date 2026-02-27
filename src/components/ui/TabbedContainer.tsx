import { useId, type ReactNode } from 'react'
import { FaXmark } from 'react-icons/fa6'

type TabbedContainerTab = {
  id: string
  label: string
}

type TabbedContainerProps = {
  tabs: TabbedContainerTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  leftTrailingAction?: ReactNode
  onTabClose?: (tabId: string) => void
  getTabCloseAriaLabel?: (tab: TabbedContainerTab) => string
  canCloseTab?: (tab: TabbedContainerTab) => boolean
  rightActions?: ReactNode
  tone?: 'default' | 'amber'
  tabSizing?: 'fill' | 'content'
  leftEarMaxWidth?: string
  className?: string
  bodyClassName?: string
  children: ReactNode
}

function joinClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

export function TabbedContainer({
  tabs,
  activeTabId,
  onTabChange,
  leftTrailingAction,
  onTabClose,
  getTabCloseAriaLabel,
  canCloseTab,
  rightActions,
  tone = 'default',
  tabSizing = 'fill',
  leftEarMaxWidth,
  className,
  bodyClassName,
  children,
}: TabbedContainerProps) {
  const isContentTabs = tabSizing === 'content'
  const toneClass = tone === 'amber' ? 'tabbed-container-amber' : undefined
  const tabbedContainerId = useId()
  const panelId = `${tabbedContainerId}-panel`
  const tabIdPrefix = `${tabbedContainerId}-tab`

  return (
    <section className={joinClasses('tabbed-container space-y-0', toneClass, className)}>
      <div className="tabbed-container-ears flex items-stretch justify-between">
        <div
          className={joinClasses(
            'tabbed-container-ear tabbed-container-ear-left',
            isContentTabs ? 'tabbed-container-ear-left-content' : 'tabbed-container-ear-left-fill',
          )}
          style={leftEarMaxWidth ? { maxWidth: leftEarMaxWidth } : undefined}
        >
          <div aria-orientation="horizontal" className="flex min-w-0 flex-1 items-stretch" role="tablist">
            {tabs.map((tab) => {
              const tabId = `${tabIdPrefix}-${tab.id}`
              const isSelected = activeTabId === tab.id
              return (
                <div className="tabbed-container-tab-shell" key={tab.id}>
                  <button
                    aria-controls={panelId}
                    aria-selected={isSelected}
                    className={joinClasses(
                      'tabbed-container-tab h-full px-3.5 text-[11px] tracking-wide transition-colors',
                      onTabClose && (canCloseTab ? canCloseTab(tab) : true) ? 'pr-6' : undefined,
                      isContentTabs ? 'tabbed-container-tab-content' : 'tabbed-container-tab-fill',
                      isSelected
                        ? 'tabbed-container-tab-active tabbed-container-tab-priority-active text-amber-100'
                        : 'tabbed-container-tab-inactive tabbed-container-tab-priority-inactive text-slate-300',
                    )}
                    id={tabId}
                    onClick={() => onTabChange(tab.id)}
                    role="tab"
                    tabIndex={isSelected ? 0 : -1}
                    type="button"
                  >
                    {tab.label}
                  </button>
                  {onTabClose && (canCloseTab ? canCloseTab(tab) : true) ? (
                    <span className="tabbed-container-tab-close-wrap">
                      <button
                        aria-label={getTabCloseAriaLabel ? getTabCloseAriaLabel(tab) : `Close ${tab.label}`}
                        className="tabbed-container-tab-close"
                        onClick={(event) => {
                          event.stopPropagation()
                          onTabClose(tab.id)
                        }}
                        type="button"
                      >
                        <FaXmark aria-hidden className="tabbed-container-tab-close-icon" />
                      </button>
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
          {leftTrailingAction ? <div className="tabbed-container-ear-left-action shrink-0">{leftTrailingAction}</div> : null}
        </div>
        <div aria-hidden className="tabbed-container-ear-gap-fill" />
        {rightActions ? <div className="tabbed-container-ear tabbed-container-ear-right shrink-0">{rightActions}</div> : null}
      </div>
      <div
        aria-labelledby={`${tabIdPrefix}-${activeTabId}`}
        className={joinClasses('tabbed-container-panel border p-2', bodyClassName)}
        id={panelId}
        role="tabpanel"
      >
        {children}
      </div>
    </section>
  )
}
