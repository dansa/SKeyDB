import {useId, useLayoutEffect, useRef, useState, type ReactNode} from 'react'

import {FaChevronRight} from 'react-icons/fa6'

import './DetailIndexedReader.css'

export interface DetailIndexEntry {
  id: string
  label: string
  children?: DetailIndexEntry[]
}

export interface DetailIndexedReaderProps {
  items: DetailIndexEntry[]
  children: ReactNode
  toolbar?: ReactNode
  selectedId?: string
  onSelect?: (id: string) => void
  scrollKey: string
  defaultExpandedGroups?: 'active' | 'all'
  resetScrollKey?: number
}

function flattenEntries(items: DetailIndexEntry[]): DetailIndexEntry[] {
  return items.flatMap((item) => [item, ...flattenEntries(item.children ?? [])])
}

/** Owns the reading scroll area so navigation never scrolls the surrounding modal. */
export function DetailIndexedReader({
  items,
  children,
  toolbar,
  selectedId,
  onSelect,
  scrollKey,
  defaultExpandedGroups = 'active',
  resetScrollKey = 0,
}: DetailIndexedReaderProps) {
  const readerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef<HTMLElement>(null)
  const positions = useRef(new Map<string, number>())
  const lastResetScrollKey = useRef(resetScrollKey)
  const anchorSelection = useRef<{id: string; scrollTop: number} | null>(null)
  const pendingSelection = useRef<string | null>(null)
  const [visibleId, setVisibleId] = useState('')
  const selectId = useId()
  const entries = flattenEntries(items)
  const entryIds = JSON.stringify(entries.map((entry) => entry.id))
  const activeId = selectedId ?? visibleId
  const activeGroup =
    items.find(
      (item) =>
        item.id === activeId ||
        flattenEntries(item.children ?? []).some((child) => child.id === activeId),
    )?.id ?? ''
  const [groupExpansion, setGroupExpansion] = useState({
    activeGroup: '',
    ids: defaultExpandedGroups === 'all' ? items.map((item) => item.id) : [],
  })
  if (defaultExpandedGroups === 'active' && groupExpansion.activeGroup !== activeGroup) {
    setGroupExpansion({activeGroup, ids: [activeGroup]})
  }
  const expandedIds =
    defaultExpandedGroups === 'all' || groupExpansion.activeGroup === activeGroup
      ? groupExpansion.ids
      : [activeGroup]

  const expandedIdSet = new Set(expandedIds)

  useLayoutEffect(() => {
    const index = indexRef.current
    if (!index) return
    const revealCurrent = () => {
      const current = index.querySelector<HTMLElement>('[aria-current]')
      const bounds = index.getBoundingClientRect()
      if (!current || bounds.height === 0) return
      const target = current.getBoundingClientRect()
      if (target.top < bounds.top) index.scrollTop += target.top - bounds.top
      else if (target.bottom > bounds.bottom) index.scrollTop += target.bottom - bounds.bottom
    }
    revealCurrent()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(revealCurrent)
    observer?.observe(index)
    return () => {
      observer?.disconnect()
    }
  }, [activeId])

  useLayoutEffect(() => {
    const reader = readerRef.current
    const content = contentRef.current
    if (!reader || !content) return
    anchorSelection.current = null
    const ids = new Set<string>(JSON.parse(entryIds) as string[])
    reader.scrollTop = positions.current.get(scrollKey) ?? 0
    const update = () => {
      positions.current.set(scrollKey, reader.scrollTop)
      const anchors = Array.from(
        content.querySelectorAll<HTMLElement>('[data-detail-anchor]'),
      ).filter((anchor) => ids.has(anchor.id))
      const top = reader.getBoundingClientRect().top
      let current = anchors[0]?.id ?? ''
      for (const anchor of anchors) {
        if (anchor.getBoundingClientRect().top > top + 32) break
        current = anchor.id
      }
      if (
        reader.scrollHeight > reader.clientHeight &&
        reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 2
      ) {
        current = anchors.at(-1)?.id ?? current
      }
      const selection = anchorSelection.current
      if (selection && Math.abs(reader.scrollTop - selection.scrollTop) < 1) current = selection.id
      else anchorSelection.current = null
      setVisibleId(current)
    }
    update()
    reader.addEventListener('scroll', update, {passive: true})
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(content)
    observer?.observe(reader)
    return () => {
      reader.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [entryIds, scrollKey])

  useLayoutEffect(() => {
    if (pendingSelection.current !== selectedId) return
    const target = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('[data-detail-anchor]') ?? [],
    ).find((anchor) => anchor.id === selectedId)
    target?.focus({preventScroll: true})
    pendingSelection.current = null
  }, [selectedId, scrollKey])

  useLayoutEffect(() => {
    if (lastResetScrollKey.current === resetScrollKey) return
    lastResetScrollKey.current = resetScrollKey
    if (readerRef.current) readerRef.current.scrollTop = 0
    positions.current.set(scrollKey, 0)
    const target = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('[data-detail-anchor]') ?? [],
    ).find((anchor) => anchor.id === selectedId)
    target?.focus({preventScroll: true})
  }, [resetScrollKey, selectedId, scrollKey])

  function selectEntry(id: string) {
    const target = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('[data-detail-anchor]') ?? [],
    ).find((anchor) => anchor.id === id)
    if (onSelect) {
      if (selectedId === id) target?.focus({preventScroll: true})
      else pendingSelection.current = id
      onSelect(id)
      return
    }
    const reader = readerRef.current
    if (!reader || !target) return
    target.focus({preventScroll: true})
    reader.scrollTop += target.getBoundingClientRect().top - reader.getBoundingClientRect().top
    positions.current.set(scrollKey, reader.scrollTop)
    anchorSelection.current = {id, scrollTop: reader.scrollTop}
    setVisibleId(id)
  }

  function indexButton(entry: DetailIndexEntry, nested = false, containsActive = false) {
    return (
      <button
        type='button'
        className={`detail-reader-index-entry${nested ? ' detail-reader-index-child' : ''}`}
        aria-current={activeId === entry.id || containsActive ? 'location' : undefined}
        onClick={() => {
          selectEntry(entry.id)
        }}
      >
        {entry.label}
      </button>
    )
  }

  return (
    <div className='detail-indexed-reader' data-has-index={items.length > 0 || undefined}>
      {toolbar ? <div className='shrink-0'>{toolbar}</div> : null}
      {items.length > 0 ? (
        <div className='detail-reader-mobile-index'>
          <label htmlFor={selectId} className='text-xs font-semibold text-slate-400'>
            Index
          </label>
          <select
            id={selectId}
            value={entries.some((entry) => entry.id === activeId) ? activeId : ''}
            onChange={(event) => {
              selectEntry(event.target.value)
            }}
            className='min-h-11 min-w-0 flex-1 rounded-none border border-slate-700 bg-slate-950 px-2 text-xs font-semibold text-slate-200 [color-scheme:dark] focus-visible:outline-1 focus-visible:outline-amber-200'
          >
            <option value='' disabled>
              Jump to…
            </option>
            {items.map((item) =>
              item.children?.length ? (
                <optgroup key={item.id} label={item.label}>
                  <option value={item.id}>{item.label}</option>
                  {flattenEntries(item.children).map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.label}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ),
            )}
          </select>
        </div>
      ) : null}
      <div className='detail-reader-body'>
        <div
          ref={readerRef}
          className='detail-reader-scroll'
          tabIndex={0}
          role='region'
          aria-label='Reading area'
        >
          <div ref={contentRef} className='min-w-0 pb-4'>
            {children}
          </div>
        </div>
        {items.length > 0 ? (
          <nav ref={indexRef} className='detail-reader-desktop-index' aria-label='Section index'>
            <p className='mb-2 pl-3 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase'>
              Index
            </p>
            <ul className='space-y-1'>
              {items.map((item) => {
                const expanded = expandedIdSet.has(item.id)
                const childrenId = `${selectId}-${item.id}`
                return (
                  <li key={item.id}>
                    <div className='flex items-start'>
                      {indexButton(item, false, !expanded && activeGroup === item.id)}
                      {item.children?.length ? (
                        <button
                          type='button'
                          className='detail-reader-group-toggle'
                          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label}`}
                          aria-expanded={expanded}
                          aria-controls={childrenId}
                          onClick={() => {
                            setGroupExpansion({
                              activeGroup,
                              ids: expanded
                                ? expandedIds.filter((id) => id !== item.id)
                                : [...expandedIds, item.id],
                            })
                          }}
                        >
                          <FaChevronRight
                            aria-hidden='true'
                            className={`mx-auto size-2.5 ${expanded ? 'rotate-90' : ''}`}
                          />
                        </button>
                      ) : null}
                    </div>
                    {item.children?.length ? (
                      <ul id={childrenId} hidden={!expanded}>
                        {flattenEntries(item.children).map((child) => (
                          <li key={child.id}>{indexButton(child, true)}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
