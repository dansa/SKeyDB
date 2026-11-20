import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

const SERIES_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const GAME_DATE = /^(20\d{2})\/(\d{2})\/(\d{2})(?: (?:[01]\d|2[0-3]):[0-5]\d)?$/

export function createTimelineRunId(series, startDate) {
  if (!SERIES_KEY.test(series)) throw new Error('Use a lowercase, hyphen-separated series key.')

  const match = GAME_DATE.exec(startDate)
  if (match) {
    const [, year, month, day] = match
    const isoDay = `${year}-${month}-${day}`
    const date = new Date(`${isoDay}T00:00:00Z`)
    if (Number.isFinite(date.getTime()) && date.toISOString().startsWith(isoDay)) {
      return `${series}-${year.slice(2)}${month}${day}`
    }
  }
  throw new Error('Use a valid game-local date in YYYY/MM/DD or YYYY/MM/DD HH:MM format.')
}

export function createUnusedTimelineRunId(series, startDate, entries) {
  const id = createTimelineRunId(series, startDate)
  if (entries.some((entry) => entry.id === id)) {
    throw new Error(`${id} is already in use. For a distinct same-day run, qualify the series key.`)
  }
  return id
}

function main() {
  const [, , series, startDate, ...extra] = process.argv
  if (!series || !startDate || extra.length) {
    throw new Error('Usage: npm run timeline:id -- <series> <YYYY/MM/DD>')
  }
  const entries = ['events', 'banners'].flatMap((kind) =>
    JSON.parse(readFileSync(new URL(`../src/data/timeline/${kind}.json`, import.meta.url), 'utf8')),
  )
  console.log(createUnusedTimelineRunId(series, startDate, entries))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
