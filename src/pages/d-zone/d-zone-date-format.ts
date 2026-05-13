import type {DzoneSeason, DzoneSeasonSummary} from '@/domain/dzone'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDzoneSeasonDateRange(season: DzoneSeason | DzoneSeasonSummary): string {
  return `${DATE_FORMATTER.format(new Date(season.start))} - ${DATE_FORMATTER.format(
    new Date(season.end),
  )}`
}
