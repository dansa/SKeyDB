import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from '@/features/database/internal/database-detail-typography'

export function DatabaseAcquisitionSection({source}: {source?: string}) {
  const text = source?.trim()
  if (!text) return null

  return (
    <section className='mt-5'>
      <h4
        className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
        style={getDatabaseDetailSectionHeadingStyle()}
      >
        How to Obtain
      </h4>
      <p
        className={`mt-3 max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
        style={getDatabaseDetailBodyStyle()}
      >
        {text}
      </p>
    </section>
  )
}
