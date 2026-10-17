export type TimelinePriceDisplayMode = 'silver-prime' | 'usd-estimate'

interface SilverPrimePack {
  amount: number
  cents: number
}

const SILVER_PRIME_PACKS: SilverPrimePack[] = [
  // Base plus repeat-purchase gifted Prime; excludes first-purchase doubling.
  {amount: 60, cents: 99},
  {amount: 330, cents: 499},
  {amount: 1090, cents: 1499},
  {amount: 2240, cents: 2999},
  {amount: 3880, cents: 4999},
  {amount: 8080, cents: 9999},
  {amount: 12800, cents: 14999},
  {amount: 17500, cents: 19999},
]

const MAX_PACK_AMOUNT = Math.max(...SILVER_PRIME_PACKS.map((pack) => pack.amount))
const PRICE_TOKEN_PATTERN =
  /(\d+(?:\.\d+)?\s*k|\d[\d,]*)(?:\s*-\s*(\d+(?:\.\d+)?\s*k|\d[\d,]*))?\s+Silver Prime/gi

const estimatedCostCache = new Map<number, number>()

function parseSilverPrimeAmount(value: string): number {
  const normalized = value.replace(/\s+/g, '').replace(/,/g, '').toLowerCase()
  if (normalized.endsWith('k')) {
    return Math.round(Number(normalized.slice(0, -1)) * 1000)
  }
  return Number(normalized)
}

function estimateSilverPrimeCostCents(amount: number): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (estimatedCostCache.has(amount)) return estimatedCostCache.get(amount) ?? null

  const limit = amount + MAX_PACK_AMOUNT - 1
  const costs = new Array<number>(limit + 1).fill(Number.POSITIVE_INFINITY)
  costs[0] = 0

  for (let subtotal = 1; subtotal <= limit; subtotal += 1) {
    for (const pack of SILVER_PRIME_PACKS) {
      if (subtotal >= pack.amount) {
        costs[subtotal] = Math.min(costs[subtotal], costs[subtotal - pack.amount] + pack.cents)
      }
    }
  }

  const best = Math.min(...costs.slice(amount))
  if (!Number.isFinite(best)) return null

  estimatedCostCache.set(amount, best)
  return best
}

function formatUsdCents(cents: number): string {
  return `$${String(Math.ceil(cents / 100))}`
}

function formatSilverPrimeEstimate(amount: number): string | null {
  const cents = estimateSilverPrimeCostCents(amount)
  return cents === null ? null : formatUsdCents(cents)
}

export function formatTimelinePrice(
  price: string | undefined,
  mode: TimelinePriceDisplayMode,
): string | undefined {
  if (!price || mode === 'silver-prime') return price

  const usdMatch = /^USD\s*(\d+(?:\.\d+)?)$/i.exec(price.trim())
  if (usdMatch) {
    return formatUsdCents(Math.round(Number(usdMatch[1]) * 100))
  }

  return price.replace(
    PRICE_TOKEN_PATTERN,
    (match: string, startAmount: string, endAmount: string | undefined) => {
      const startEstimate = formatSilverPrimeEstimate(parseSilverPrimeAmount(startAmount))
      if (!startEstimate) return match

      if (!endAmount) return `~${startEstimate}`

      const endEstimate = formatSilverPrimeEstimate(parseSilverPrimeAmount(endAmount))
      if (!endEstimate) return match

      return `~${startEstimate}-${endEstimate.replace('$', '')}`
    },
  )
}
