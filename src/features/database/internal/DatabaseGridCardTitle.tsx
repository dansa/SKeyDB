import type {ReactNode} from 'react'

import {databaseCardTitleClassName} from './database-card-typography'

interface DatabaseGridCardTitleProps {
  children: ReactNode
  title: string
}

export function DatabaseGridCardTitle({children, title}: DatabaseGridCardTitleProps) {
  return (
    <p className={`${databaseCardTitleClassName} database-grid-card__title-text`} title={title}>
      {children}
    </p>
  )
}
