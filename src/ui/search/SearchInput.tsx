import {useId, type RefObject} from 'react'

interface SearchInputProps {
  label: string
  placeholder: string
  query: string
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
}

export function SearchInput({
  label,
  onQueryChange,
  placeholder,
  query,
  searchInputRef,
}: SearchInputProps) {
  const searchInputId = useId()

  return (
    <div className='min-w-0'>
      <label className='sr-only' htmlFor={searchInputId}>
        {label}
      </label>
      <input
        autoComplete='off'
        className='h-10 w-full min-w-0 rounded-[2px] border border-slate-600/80 bg-[linear-gradient(180deg,rgba(13,20,34,0.92),rgba(8,13,24,0.86))] px-3 text-sm text-slate-100 transition-[border-color,background-color] outline-none placeholder:text-slate-500 focus:border-amber-300/60 sm:h-11'
        id={searchInputId}
        name='database-search'
        onChange={(event) => {
          onQueryChange(event.target.value)
        }}
        placeholder={placeholder}
        ref={searchInputRef}
        type='search'
        value={query}
      />
    </div>
  )
}
