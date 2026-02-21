import { ModalFrame } from './ModalFrame'
import { Button } from './Button'

type ImportStrategyDialogProps = {
  conflictSummary: string
  onCancel: () => void
  onMove: () => void
  onSkip: () => void
}

export function ImportStrategyDialog({ conflictSummary, onCancel, onMove, onSkip }: ImportStrategyDialogProps) {
  return (
    <ModalFrame ariaLabel="Resolve import conflicts" title="Resolve Import Conflicts">
      <p className="mt-2 text-sm text-slate-200">{conflictSummary}</p>
      <p className="mt-2 text-xs text-slate-300">
        Move: remove duplicates from existing teams. Skip: keep existing teams and drop duplicates from import.
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onSkip} variant="secondary">
          Skip Duplicates
        </Button>
        <Button onClick={onMove} variant="primary">
          Move To Imported Team
        </Button>
      </div>
    </ModalFrame>
  )
}
