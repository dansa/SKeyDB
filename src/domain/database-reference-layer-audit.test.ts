import {describe, expect, it} from 'vitest'

import type {EntityRef} from '@/data-access/public-data/contract'
import {
  resolvePublicReferenceTokenResult,
  type PublicReferenceResolveResult,
} from '@/data-access/public-data/referenceRepository'
import {getTestPublicCatalogRecords} from '@/data-access/public-data/testSupport/publicCatalogs'

import {resolveDatabaseReferenceInfo} from './database-reference-info'
import type {ResolvedDatabaseReferenceLayer} from './database-reference-layer'
import {parseDatabaseRichDescription} from './database-rich-text'
import type {DescribedRecord} from './description-records'
import {loadPublicWheelDetailById} from './public-detail-record-adapters'
import type {RichSegment} from './rich-text'
import {
  buildWheelDatabaseDescriptionRecord,
  buildWheelDatabaseReferenceLayer,
} from './wheels-database-reference-layer'
import type {WheelFullRecord} from './wheels-full'

interface TokenAuditIssue {
  layer: string
  recordId: string
  token: string
  status: PublicReferenceResolveResult['status']
  refs: EntityRef[]
}

interface TokenAuditResult {
  blockingIssues: TokenAuditIssue[]
  reportOnlyIssues: TokenAuditIssue[]
}

function isTokenSegment(
  segment: RichSegment,
): segment is Extract<RichSegment, {type: 'mechanic' | 'reference' | 'skill'}> {
  return segment.type === 'mechanic' || segment.type === 'reference' || segment.type === 'skill'
}

function getTokenSegmentName(
  segment: Extract<RichSegment, {type: 'mechanic' | 'reference' | 'skill'}>,
): string {
  return segment.name
}

function getDistinctDescriptionTokens(
  record: DescribedRecord,
  referenceLayer: ResolvedDatabaseReferenceLayer,
): string[] {
  const tokens = new Set<string>()
  for (const segment of parseDatabaseRichDescription({record, referenceLayer})) {
    if (isTokenSegment(segment)) {
      tokens.add(getTokenSegmentName(segment))
    }
  }
  return [...tokens]
}

function hasGlobalDerivedReference(refs: readonly EntityRef[]): boolean {
  return refs.some((ref) => ref.kind === 'derivedSkill' && ref.id.startsWith('derived.global.'))
}

function hasGlobalOverlayReference(refs: readonly EntityRef[]): boolean {
  return refs.some((ref) => ref.kind === 'overlay' && ref.id.startsWith('overlay.global.'))
}

function shouldWheelLayerResolve(refs: readonly EntityRef[]): boolean {
  return (
    refs.some((ref) => ref.kind === 'wheel') ||
    hasGlobalOverlayReference(refs) ||
    hasGlobalDerivedReference(refs)
  )
}

function auditRecordTokens({
  layerName,
  record,
  referenceLayer,
  shouldResolve,
}: {
  layerName: string
  record: DescribedRecord
  referenceLayer: ResolvedDatabaseReferenceLayer
  shouldResolve: (refs: readonly EntityRef[]) => boolean
}): TokenAuditResult {
  const blockingIssues: TokenAuditIssue[] = []
  const reportOnlyIssues: TokenAuditIssue[] = []

  for (const token of getDistinctDescriptionTokens(record, referenceLayer)) {
    const resolvedInfo = resolveDatabaseReferenceInfo(referenceLayer, token)
    if (resolvedInfo) {
      continue
    }

    const publicReference = resolvePublicReferenceTokenResult(token)
    const issue = {
      layer: layerName,
      recordId: record.id,
      token,
      status: publicReference.status,
      refs: publicReference.refs,
    }

    if (publicReference.status !== 'notFound' && shouldResolve(publicReference.refs)) {
      blockingIssues.push(issue)
    } else {
      reportOnlyIssues.push(issue)
    }
  }

  return {blockingIssues, reportOnlyIssues}
}

function formatIssue(issue: TokenAuditIssue): string {
  const refs =
    issue.refs.length > 0
      ? issue.refs.map((ref) => `${ref.kind}:${ref.id}`).join(', ')
      : 'no public reference'
  return `${issue.layer} ${issue.recordId} {${issue.token}} -> ${issue.status} (${refs})`
}

function reportReferenceTokenIssues(issues: TokenAuditIssue[]): void {
  if (issues.length === 0) {
    return
  }

  const formatted = issues.slice(0, 40).map(formatIssue)
  const remaining = issues.length - formatted.length
  console.warn(
    [
      'Non-blocking database reference token audit findings:',
      ...formatted,
      remaining > 0 ? `...and ${remaining.toString()} more` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )
}

async function loadWheelRecords(): Promise<WheelFullRecord[]> {
  const records = await Promise.all(
    getTestPublicCatalogRecords('wheels').map((entry) => loadPublicWheelDetailById(entry.id)),
  )
  return records.filter(Boolean) as WheelFullRecord[]
}

describe('database reference layer audit', () => {
  it('keeps wheel detail reference tokens resolvable for the shared wheel-layer contract', async () => {
    const wheelRecords = await loadWheelRecords()
    const blockingIssues: TokenAuditIssue[] = []
    const reportOnlyIssues: TokenAuditIssue[] = []

    for (const wheelRecord of wheelRecords) {
      const referenceLayer = buildWheelDatabaseReferenceLayer({
        activeWheelId: wheelRecord.id,
        wheelRecords,
      })
      const result = auditRecordTokens({
        layerName: 'wheel',
        record: buildWheelDatabaseDescriptionRecord(wheelRecord),
        referenceLayer,
        shouldResolve: shouldWheelLayerResolve,
      })
      blockingIssues.push(...result.blockingIssues)
      reportOnlyIssues.push(...result.reportOnlyIssues)
    }

    reportReferenceTokenIssues(reportOnlyIssues)
    expect(blockingIssues.map(formatIssue)).toEqual([])
  })
})
