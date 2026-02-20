import { useMemo, useState } from 'react'
import { getAwakenerCardAsset } from '../domain/awakener-assets'
import { getAwakeners } from '../domain/awakeners'
import { searchAwakeners } from '../domain/awakeners-search'
import { formatAwakenerNameForUi } from '../domain/name-format'

const awakeners = getAwakeners()

export function CharactersPage() {
  const [query, setQuery] = useState('')
  const filteredAwakeners = useMemo(() => searchAwakeners(awakeners, query), [query])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="ui-title text-2xl text-amber-100">Characters</h2>
        <p className="text-sm text-slate-300">
          {filteredAwakeners.length}/{awakeners.length} awakeners
        </p>
      </header>

      <label className="block space-y-1">
        <span className="text-sm text-slate-300">Search (name, faction, aliases)</span>
        <input
          className="w-full border border-slate-500/60 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-400 focus:border-amber-200/70"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: ghelot, g-helot, murhpy fauxbrn"
          type="search"
          value={query}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredAwakeners.map((awakener) => {
          const cardAsset = getAwakenerCardAsset(awakener.name)
          const displayName = formatAwakenerNameForUi(awakener.name)

          return (
            <article
              className="border border-slate-500/50 bg-slate-900/55 p-3 shadow-[0_0_0_1px_rgba(148,163,184,0.1)]"
              key={`${awakener.name}-${awakener.faction}`}
            >
              <div className="relative aspect-[25/56] overflow-hidden border border-amber-100/35 bg-gradient-to-b from-slate-800 to-slate-900">
                {cardAsset ? (
                  <img
                    alt={`${displayName} card`}
                    className="h-full w-full object-cover object-top"
                    src={cardAsset}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]" />
                )}
              </div>
              <h3 className="mt-3 ui-title text-lg text-amber-100">{displayName}</h3>
              <p className="text-xs uppercase tracking-wide text-sky-300">{awakener.faction}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
