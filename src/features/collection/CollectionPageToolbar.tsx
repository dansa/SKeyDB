import type {ChangeEvent, ComponentProps} from 'react'

import {FaDownload, FaUpload} from 'react-icons/fa6'

import {Button} from '@/components/ui/Button'
import {PageToolkitBar} from '@/components/ui/PageToolkitBar'

import {OwnedAwakenerBoxExport} from './OwnedAwakenerBoxExport'
import {OwnedWheelBoxExport} from './OwnedWheelBoxExport'
import type {CollectionViewModel} from './useCollectionViewModel'

interface CollectionPageToolbarProps {
  model: CollectionViewModel
  importFileInputRef: {current: HTMLInputElement | null}
  onLoadFromFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  onOpenLoadFilePicker: () => void
  onSaveToFile: () => void
  onStatusMessage: (message: string) => void
  ownedAwakenersForBoxExport: ComponentProps<typeof OwnedAwakenerBoxExport>['entries']
  ownedWheelsForBoxExport: ComponentProps<typeof OwnedWheelBoxExport>['entries']
}

function renderTabExportAction({
  model,
  onStatusMessage,
  ownedAwakenersForBoxExport,
  ownedWheelsForBoxExport,
}: Pick<
  CollectionPageToolbarProps,
  'model' | 'onStatusMessage' | 'ownedAwakenersForBoxExport' | 'ownedWheelsForBoxExport'
>) {
  if (model.tab === 'awakeners') {
    return (
      <OwnedAwakenerBoxExport
        entries={ownedAwakenersForBoxExport}
        onStatusMessage={onStatusMessage}
      />
    )
  }

  if (model.tab === 'wheels') {
    return (
      <OwnedWheelBoxExport entries={ownedWheelsForBoxExport} onStatusMessage={onStatusMessage} />
    )
  }

  return null
}

export function CollectionPageToolbar({
  model,
  importFileInputRef,
  onLoadFromFile,
  onOpenLoadFilePicker,
  onSaveToFile,
  onStatusMessage,
  ownedAwakenersForBoxExport,
  ownedWheelsForBoxExport,
}: CollectionPageToolbarProps) {
  return (
    <>
      <input
        accept='application/json,.json'
        className='hidden'
        onChange={(event) => {
          void onLoadFromFile(event)
        }}
        ref={importFileInputRef}
        type='file'
      />

      <PageToolkitBar className='collection-toolkit-drawer'>
        {renderTabExportAction({
          model,
          onStatusMessage,
          ownedAwakenersForBoxExport,
          ownedWheelsForBoxExport,
        })}
        <Button
          className='px-2 py-1 text-[10px] tracking-wide uppercase'
          onClick={onSaveToFile}
          type='button'
        >
          <span className='inline-flex items-center gap-1'>
            <FaDownload aria-hidden className='text-[9px]' />
            <span>Save to File</span>
          </span>
        </Button>
        <Button
          className='px-2 py-1 text-[10px] tracking-wide uppercase'
          onClick={onOpenLoadFilePicker}
          type='button'
        >
          <span className='inline-flex items-center gap-1'>
            <FaUpload aria-hidden className='text-[9px]' />
            <span>Load from File</span>
          </span>
        </Button>
      </PageToolkitBar>
    </>
  )
}
