export interface CanonicalCardClassification {
  cardFamily?: string
  cardTypes?: readonly string[]
  countsAs?: readonly string[]
}

function humanizeCardClassification(value: string): string {
  return value
    .trim()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

export function getCanonicalCardClassificationLabels(
  classification: CanonicalCardClassification,
): string[] {
  const labels: string[] = []
  const primaryValues = [classification.cardFamily, ...(classification.cardTypes ?? [])]
  const seenPrimaryLabels = new Set<string>()

  for (const value of primaryValues) {
    if (!value?.trim()) {
      continue
    }
    const label = humanizeCardClassification(value)
    const normalizedLabel = label.toLowerCase()
    if (seenPrimaryLabels.has(normalizedLabel)) {
      continue
    }
    seenPrimaryLabels.add(normalizedLabel)
    labels.push(label)
  }

  for (const value of classification.countsAs ?? []) {
    if (value.trim()) {
      labels.push(`Counts as ${humanizeCardClassification(value)}`)
    }
  }

  return labels
}

export function formatCanonicalCardMetadata(
  classification: CanonicalCardClassification,
  cost: string,
): string {
  return [`Cost ${cost}`, ...getCanonicalCardClassificationLabels(classification)].join(' · ')
}
