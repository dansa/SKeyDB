import type {Ref} from 'react'

import type {
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2PickerTab,
  BuilderV2PosseOption,
  BuilderV2WheelOption,
} from './useBuilderV2Model'

interface BuilderV2AwakenerPickerProps {
  awakeners: BuilderV2AwakenerOption[]
  covenants: BuilderV2CovenantOption[]
  pickerTab: BuilderV2PickerTab
  posses: BuilderV2PosseOption[]
  searchQuery: string
  wheels: BuilderV2WheelOption[]
  onAssignAwakener: (awakenerId: string) => void
  onAssignCovenant: (covenantId: string) => void
  onAssignPosse: (posseId: string) => void
  onAssignWheel: (wheelId: string) => void
  onPickerTabChange: (nextTab: BuilderV2PickerTab) => void
  onSearchChange: (nextQuery: string) => void
}

const pickerTabs: {id: BuilderV2PickerTab; label: string}[] = [
  {id: 'awakeners', label: 'Awakeners'},
  {id: 'wheels', label: 'Wheels'},
  {id: 'covenants', label: 'Covenants'},
  {id: 'posses', label: 'Posses'},
]

const pickerCopy: Record<BuilderV2PickerTab, {title: string; searchLabel: string}> = {
  awakeners: {title: 'Awakeners', searchLabel: 'Search awakeners'},
  wheels: {title: 'Wheels', searchLabel: 'Search wheels'},
  covenants: {title: 'Covenants', searchLabel: 'Search covenants'},
  posses: {title: 'Posses', searchLabel: 'Search posses'},
}

export function BuilderV2AwakenerPicker({
  awakeners,
  covenants,
  pickerTab,
  posses,
  searchQuery,
  wheels,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
  onPickerTabChange,
  onSearchChange,
}: BuilderV2AwakenerPickerProps) {
  const activeCopy = pickerCopy[pickerTab]

  return (
    <aside className='builder-v2-panel builder-v2-armory' aria-label='Builder V2 armory'>
      <div className='builder-v2-section-header'>
        <div>
          <p className='builder-v2-label'>Armory</p>
          <h2 className='ui-title'>{activeCopy.title}</h2>
        </div>
      </div>

      <BuilderV2PickerContent
        awakeners={awakeners}
        covenants={covenants}
        onAssignAwakener={onAssignAwakener}
        onAssignCovenant={onAssignCovenant}
        onAssignPosse={onAssignPosse}
        onAssignWheel={onAssignWheel}
        onPickerTabChange={onPickerTabChange}
        onSearchChange={onSearchChange}
        pickerTab={pickerTab}
        posses={posses}
        searchQuery={searchQuery}
        wheels={wheels}
      />
    </aside>
  )
}

interface BuilderV2PickerContentProps extends BuilderV2AwakenerPickerProps {
  searchInputRef?: Ref<HTMLInputElement>
}

export function BuilderV2PickerContent({
  awakeners,
  covenants,
  pickerTab,
  posses,
  searchInputRef,
  searchQuery,
  wheels,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
  onPickerTabChange,
  onSearchChange,
}: BuilderV2PickerContentProps) {
  const activeCopy = pickerCopy[pickerTab]

  return (
    <>
      <div className='builder-v2-picker-tabs' role='tablist' aria-label='Picker categories'>
        {pickerTabs.map((tab) => {
          const isActive = tab.id === pickerTab
          return (
            <button
              aria-controls='builder-v2-picker-panel'
              aria-selected={isActive}
              className={`builder-v2-tab ${isActive ? 'builder-v2-tab--active' : ''}`}
              id={`builder-v2-tab-${tab.id}`}
              key={tab.id}
              onClick={() => {
                onPickerTabChange(tab.id)
              }}
              role='tab'
              type='button'
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <label className='builder-v2-search-label'>
        <span className='sr-only'>{activeCopy.searchLabel}</span>
        <input
          className='builder-v2-search'
          onChange={(event) => {
            onSearchChange(event.target.value)
          }}
          placeholder={activeCopy.searchLabel}
          ref={searchInputRef}
          type='search'
          value={searchQuery}
        />
      </label>

      <div
        aria-labelledby={`builder-v2-tab-${pickerTab}`}
        className='builder-v2-picker-results'
        id='builder-v2-picker-panel'
        role='tabpanel'
      >
        {pickerTab === 'awakeners'
          ? awakeners.map((awakener) => (
              <button
                className='builder-v2-picker-row'
                data-in-use={awakener.inUse}
                key={awakener.id}
                onClick={() => {
                  onAssignAwakener(awakener.id)
                }}
                type='button'
              >
                <PickerAsset
                  alt={`${awakener.displayName} portrait`}
                  fallback={awakener.displayName}
                  src={awakener.portraitSrc}
                />
                <span className='builder-v2-picker-copy'>
                  <span className='builder-v2-picker-name ui-title'>{awakener.displayName}</span>
                  <span className='builder-v2-picker-meta'>
                    {awakener.realm}
                    {awakener.inUse ? ' - In use' : ''}
                  </span>
                </span>
              </button>
            ))
          : null}

        {pickerTab === 'wheels'
          ? wheels.map((wheel) => (
              <button
                className='builder-v2-picker-row'
                data-in-use={wheel.inUse}
                key={wheel.id}
                onClick={() => {
                  onAssignWheel(wheel.id)
                }}
                type='button'
              >
                <PickerAsset
                  alt={`${wheel.name} icon`}
                  fallback={wheel.name}
                  src={wheel.assetSrc}
                />
                <span className='builder-v2-picker-copy'>
                  <span className='builder-v2-picker-name ui-title'>{wheel.name}</span>
                  <span className='builder-v2-picker-meta'>
                    {wheel.rarity} - {wheel.realm} - {wheel.mainstat}
                    {wheel.inUse ? ' - In use' : ''}
                  </span>
                </span>
              </button>
            ))
          : null}

        {pickerTab === 'covenants'
          ? covenants.map((covenant) => (
              <button
                className='builder-v2-picker-row'
                data-in-use={covenant.inUse}
                key={covenant.id}
                onClick={() => {
                  onAssignCovenant(covenant.id)
                }}
                type='button'
              >
                <PickerAsset
                  alt={`${covenant.name} icon`}
                  fallback={covenant.name}
                  src={covenant.assetSrc}
                />
                <span className='builder-v2-picker-copy'>
                  <span className='builder-v2-picker-name ui-title'>{covenant.name}</span>
                  <span className='builder-v2-picker-meta'>
                    Covenant{covenant.inUse ? ' - In this team' : ''}
                  </span>
                </span>
              </button>
            ))
          : null}

        {pickerTab === 'posses'
          ? posses.map((posse) => (
              <button
                className='builder-v2-picker-row'
                data-in-use={posse.inUse}
                key={posse.id}
                onClick={() => {
                  onAssignPosse(posse.id)
                }}
                type='button'
              >
                <PickerAsset
                  alt={`${posse.name} icon`}
                  fallback={posse.name}
                  src={posse.assetSrc}
                />
                <span className='builder-v2-picker-copy'>
                  <span className='builder-v2-picker-name ui-title'>{posse.name}</span>
                  <span className='builder-v2-picker-meta'>
                    {posse.realm}
                    {posse.isActive ? ' - Active' : posse.inUse ? ' - In use' : ''}
                  </span>
                </span>
              </button>
            ))
          : null}
      </div>
    </>
  )
}

interface PickerAssetProps {
  alt: string
  fallback: string
  src: string | undefined
}

function PickerAsset({alt, fallback, src}: PickerAssetProps) {
  return (
    <span className='builder-v2-picker-portrait'>
      {src ? (
        <img alt={alt} draggable={false} src={src} />
      ) : (
        <span aria-hidden className='builder-v2-empty-mark'>
          {fallback.slice(0, 1)}
        </span>
      )}
    </span>
  )
}
