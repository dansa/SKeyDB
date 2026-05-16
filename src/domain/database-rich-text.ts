import type {AwakenerOverlayRecord} from './awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from './database-reference-layer'
import type {DescribedRecord} from './description-records'
import {
  buildRichTextParseContext,
  parseRichDescriptionWithContext,
  type RichSegment,
  type RichTextParseContext,
  type RichTextParseOptions,
} from './rich-text'

const EMPTY_CARD_NAMES = new Set<string>()

export function buildDatabaseRichDescriptionText(
  text?: string,
  keywordFooterText?: string,
): string {
  if (!keywordFooterText) {
    return text ?? ''
  }

  return text ? `${text}\n${keywordFooterText}` : keywordFooterText
}

function isOverlayRecord(record: DescribedRecord): record is AwakenerOverlayRecord {
  return 'overlayType' in record && Array.isArray(record.aliases)
}

function getImplicitPlainTextReferenceNames(record: DescribedRecord): string[] {
  if (!('kind' in record)) {
    return []
  }

  if (record.kind === 'rouse') {
    return ['Rouse']
  }

  if (record.kind === 'over_exalt') {
    return ['Over Exalt']
  }

  return []
}

function shouldEnableFollowupLineBreaks(record: DescribedRecord): boolean {
  if ('overlayType' in record) {
    return false
  }

  if ('kind' in record) {
    return true
  }

  if ('childDerivedSkillIds' in record) {
    return record.nodeKind !== 'group'
  }

  return false
}

export function buildDatabaseRichTextParseOptions(
  record: DescribedRecord | undefined,
  referenceLayer: ResolvedDatabaseReferenceLayer | null | undefined,
  overlays?: readonly AwakenerOverlayRecord[],
): RichTextParseOptions | undefined {
  if (!record) {
    return undefined
  }

  const excludedSkillNames = new Set<string>()
  if (referenceLayer?.referenceInfoByName) {
    for (const [name, info] of referenceLayer.referenceInfoByName) {
      if (info.kind === 'overlay' || info.id !== record.id) {
        continue
      }
      excludedSkillNames.add(name)
    }
  }

  const plainTextMechanicNames = new Set<string>()
  for (const implicitName of getImplicitPlainTextReferenceNames(record)) {
    plainTextMechanicNames.add(implicitName)
  }
  if (isOverlayRecord(record)) {
    plainTextMechanicNames.add(record.displayName)
    for (const alias of record.aliases) {
      plainTextMechanicNames.add(alias)
    }
  }

  const overlayMechanicNames = new Set<string>()
  const candidateOverlays = overlays ?? referenceLayer?.accessibleOverlays ?? []
  for (const overlay of candidateOverlays) {
    overlayMechanicNames.add(overlay.displayName)
    for (const alias of overlay.aliases) {
      overlayMechanicNames.add(alias)
    }
  }

  if (
    excludedSkillNames.size === 0 &&
    plainTextMechanicNames.size === 0 &&
    overlayMechanicNames.size === 0
  ) {
    return undefined
  }

  return {
    excludedSkillNames,
    plainTextMechanicNames,
    overlayMechanicNames,
    enableFollowupLineBreaks: shouldEnableFollowupLineBreaks(record),
  }
}

interface ParseDatabaseRichDescriptionOptions {
  text?: string
  record?: DescribedRecord
  keywordFooterText?: string
  cardNames?: ReadonlySet<string>
  referenceLayer?: ResolvedDatabaseReferenceLayer | null
  overlays?: readonly AwakenerOverlayRecord[]
}

interface ParseDatabaseRichDescriptionWithContextOptions {
  text?: string
  record?: DescribedRecord
  keywordFooterText?: string
  context: RichTextParseContext
}

export function buildDatabaseRichTextParseContext(
  cardNames: ReadonlySet<string>,
  record: DescribedRecord | undefined,
  referenceLayer: ResolvedDatabaseReferenceLayer | null | undefined,
  overlays?: readonly AwakenerOverlayRecord[],
): RichTextParseContext {
  return buildRichTextParseContext(
    cardNames,
    buildDatabaseRichTextParseOptions(record, referenceLayer, overlays),
  )
}

export function parseDatabaseRichDescriptionWithContext({
  text,
  record,
  keywordFooterText,
  context,
}: ParseDatabaseRichDescriptionWithContextOptions): RichSegment[] {
  return parseRichDescriptionWithContext(
    buildDatabaseRichDescriptionText(record?.descriptionTemplate ?? text, keywordFooterText),
    context,
    record?.descriptionArgs,
  )
}

export function parseDatabaseRichDescription({
  text,
  record,
  keywordFooterText,
  cardNames,
  referenceLayer,
  overlays,
}: ParseDatabaseRichDescriptionOptions): RichSegment[] {
  const context = buildDatabaseRichTextParseContext(
    cardNames ?? referenceLayer?.cardNames ?? EMPTY_CARD_NAMES,
    record,
    referenceLayer,
    overlays,
  )

  return parseDatabaseRichDescriptionWithContext({text, record, keywordFooterText, context})
}
