import type {BuilderV2Model} from './BuilderV2ModelTypes'

interface BuilderV2ImportExportActionsProps {
  model: Pick<
    BuilderV2Model,
    | 'openActiveTeamExportDialog'
    | 'openActiveTeamIngameExportDialog'
    | 'openExportAllDialog'
    | 'openImportDialog'
  >
}

export function BuilderV2ImportExportActions({model}: BuilderV2ImportExportActionsProps) {
  return (
    <fieldset className='builder-v2-io-actions'>
      <legend className='sr-only'>Builder V2 import and export actions</legend>
      <button className='builder-v2-io-button' onClick={model.openImportDialog} type='button'>
        Import
      </button>
      <button
        className='builder-v2-io-button'
        onClick={model.openActiveTeamExportDialog}
        type='button'
      >
        Export Active
      </button>
      <button className='builder-v2-io-button' onClick={model.openExportAllDialog} type='button'>
        Export All
      </button>
      <button
        className='builder-v2-io-button'
        onClick={model.openActiveTeamIngameExportDialog}
        type='button'
      >
        Export In-Game
      </button>
    </fieldset>
  )
}
