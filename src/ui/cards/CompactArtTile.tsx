import type {ReactNode} from 'react'

interface CompactArtTileProps {
  name: string
  nameTitle?: string
  preview: ReactNode
  chips?: ReactNode
  statusBar?: ReactNode
  overlay?: ReactNode
  containerClassName?: string
  previewClassName?: string
  nameClassName?: string
}

export function CompactArtTile({
  name,
  nameTitle,
  preview,
  chips,
  statusBar,
  overlay,
  containerClassName = '',
  previewClassName = '',
  nameClassName = '',
}: CompactArtTileProps) {
  return (
    <div className={`compact-art-tile flex w-full min-w-0 flex-col ${containerClassName}`.trim()}>
      <div
        className={`compact-art-tile-preview relative w-full overflow-hidden ${previewClassName}`.trim()}
      >
        {preview}
        {overlay ?? null}
        {statusBar ? (
          <div className='pointer-events-none absolute inset-x-0 top-0 z-30'>{statusBar}</div>
        ) : null}
        {chips ? (
          <div
            className={`pointer-events-none absolute left-1 z-20 flex flex-col gap-1 ${statusBar ? 'top-5' : 'top-1'}`}
          >
            {chips}
          </div>
        ) : null}
      </div>
      <p
        className={`compact-art-tile-name mt-1 min-w-0 text-[11px] text-slate-200 ${nameClassName}`.trim()}
        title={nameTitle}
      >
        {name}
      </p>
    </div>
  )
}
