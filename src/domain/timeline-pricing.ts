export type TimelinePriceDisplayMode = 'silver-prime' | 'usd-estimate'

interface SilverPrimePack {
  paid: number
  gifted: number
  cents: number
}

const SILVER_PRIME_PACKS: SilverPrimePack[] = [
  // Gifted amounts are the regular bonuses, not first-purchase matches.
  {paid: 60, gifted: 0, cents: 99},
  {paid: 300, gifted: 30, cents: 499},
  {paid: 980, gifted: 110, cents: 1499},
  {paid: 1980, gifted: 260, cents: 2999},
  {paid: 3280, gifted: 600, cents: 4999},
  {paid: 6480, gifted: 1600, cents: 9999},
  {paid: 9800, gifted: 3000, cents: 14999},
  {paid: 12800, gifted: 4700, cents: 19999},
]

const PRICE_TOKEN_PATTERN =
  /(\d+(?:\.\d+)?\s*k|\d[\d,]*)(?:\s*-\s*(\d+(?:\.\d+)?\s*k|\d[\d,]*))?\s+Silver Prime/gi

const spendableCostCache = new Map<number, number>()
const extractionCostCache = new Map<number, number>()

function parseSilverPrimeAmount(value: string): number {
  const normalized = value.replace(/\s+/g, '').replace(/,/g, '').toLowerCase()
  if (normalized.endsWith('k')) {
    return Math.round(Number(normalized.slice(0, -1)) * 1000)
  }
  return Number(normalized)
}

function estimateSilverPrimeCostCents(amount: number, includeGifted: boolean): number | null {
  if (!Number.isSafeInteger(amount) || amount <= 0) return null
  const cache = includeGifted ? spendableCostCache : extractionCostCache
  const cached = cache.get(amount)
  if (cached !== undefined) return cached

  const packs = SILVER_PRIME_PACKS.map(({paid, gifted, cents}) => ({
    amount: paid + (includeGifted ? gifted : 0),
    cents,
  }))
  const limit = amount + Math.max(...packs.map((pack) => pack.amount)) - 1
  const costs = new Array<number>(limit + 1).fill(Number.POSITIVE_INFINITY)
  costs[0] = 0

  for (let subtotal = 1; subtotal <= limit; subtotal += 1) {
    for (const pack of packs) {
      if (subtotal >= pack.amount) {
        costs[subtotal] = Math.min(costs[subtotal], costs[subtotal - pack.amount] + pack.cents)
      }
    }
  }

  const best = Math.min(...costs.slice(amount))
  if (!Number.isFinite(best)) return null

  cache.set(amount, best)
  return best
}

function formatUsdCents(cents: number): string {
  return `$${String(Math.ceil(cents / 100))}`
}

function formatSilverPrimeEstimate(amount: number, includeGifted: boolean): string | null {
  const cents = estimateSilverPrimeCostCents(amount, includeGifted)
  return cents === null ? null : formatUsdCents(cents)
}

export function formatTimelinePrice(
  price: string | undefined,
  mode: TimelinePriceDisplayMode,
  {includeGifted = true}: {includeGifted?: boolean} = {},
): string | undefined {
  if (!price) return price
  // Real-money prices are already exact, so both modes show them the same way.
  const usdMatch = /^USD\s*(\d+(?:\.\d+)?)$/i.exec(price.trim())
  if (usdMatch) return '$' + Number(usdMatch[1]).toFixed(2)
  if (mode === 'silver-prime') {
    return price.replace(
      PRICE_TOKEN_PATTERN,
      (_match: string, startAmount: string, endAmount: string | undefined) => {
        const start = parseSilverPrimeAmount(startAmount).toLocaleString('en-US')
        const end = endAmount ? `–${parseSilverPrimeAmount(endAmount).toLocaleString('en-US')}` : ''
        return `${start}${end} Silver Prime`
      },
    )
  }

  return price.replace(
    PRICE_TOKEN_PATTERN,
    (match: string, startAmount: string, endAmount: string | undefined) => {
      const startEstimate = formatSilverPrimeEstimate(
        parseSilverPrimeAmount(startAmount),
        includeGifted,
      )
      if (!startEstimate) return match

      if (!endAmount) return `~${startEstimate}`

      const endEstimate = formatSilverPrimeEstimate(
        parseSilverPrimeAmount(endAmount),
        includeGifted,
      )
      if (!endEstimate) return match

      return `~${startEstimate}-${endEstimate.replace('$', '')}`
    },
  )
}
