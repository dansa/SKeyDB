import {useEffect, useRef, useState} from 'react'

const MOBILE_TAG_ROWS_HEIGHT = 46

interface DatabaseDetailTagStripProps {
  className?: string
  itemKey: string
  tags: readonly string[]
}

export function DatabaseDetailTagStrip({
  className = '',
  itemKey,
  tags,
}: DatabaseDetailTagStripProps) {
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null)
  const [canExpandTags, setCanExpandTags] = useState(false)
  const tagsRef = useRef<HTMLDivElement>(null)
  const showAllTags = expandedItemKey === itemKey

  useEffect(() => {
    const element = tagsRef.current

    function refreshTagsOverflow() {
      if (!element) {
        setCanExpandTags(false)
        return
      }
      setCanExpandTags(element.scrollHeight > MOBILE_TAG_ROWS_HEIGHT + 1)
    }

    refreshTagsOverflow()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', refreshTagsOverflow)
      return () => {
        window.removeEventListener('resize', refreshTagsOverflow)
      }
    }

    const observer = new ResizeObserver(refreshTagsOverflow)
    if (element) {
      observer.observe(element)
    }

    return () => {
      observer.disconnect()
    }
  }, [itemKey, tags])

  if (tags.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div
        className={`flex flex-wrap gap-1 overflow-hidden md:overflow-visible ${
          showAllTags ? 'max-h-[18rem] md:max-h-none' : 'max-h-[46px] md:max-h-none'
        }`}
        ref={tagsRef}
      >
        {tags.map((tag) => (
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
          className='mt-1 text-[10px] text-slate-500 transition-colors hover:text-slate-300 focus-visible:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none md:hidden'
          onClick={() => {
            setExpandedItemKey(showAllTags ? null : itemKey)
          }}
          type='button'
        >
          {showAllTags ? 'Show fewer tags' : 'Show all tags'}
        </button>
      ) : null}
    </div>
  )
}
