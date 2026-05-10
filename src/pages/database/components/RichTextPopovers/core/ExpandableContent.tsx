import {useLayoutEffect, useRef, useState, type ReactNode} from 'react'

import {POPOVER_LAYOUT} from './popover-config'

interface ExpandableContentProps {
  children: ReactNode
  className?: string
  maxHeight?: number
}

export function ExpandableContent({
  children,
  className = '',
  maxHeight = POPOVER_LAYOUT.MAX_CONTENT_HEIGHT,
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (el) {
      setHasOverflow(el.scrollHeight > maxHeight)
    }
  }, [children, maxHeight])

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`relative transition-[max-height] duration-300 ease-in-out ${
          !isExpanded && hasOverflow ? 'overflow-hidden' : ''
        }`}
        style={
          !isExpanded && hasOverflow
            ? {
                maxHeight: `${String(maxHeight)}px`,
                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
              }
            : {}
        }
      >
        {children}
      </div>

      {hasOverflow && !isExpanded && (
        <button
          className='mt-2 w-full rounded-sm border border-white/5 bg-white/5 py-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase transition-all hover:bg-white/10 hover:text-slate-200'
          onClick={() => {
            setIsExpanded(true)
          }}
          type='button'
        >
          Show More
        </button>
      )}
    </div>
  )
}
