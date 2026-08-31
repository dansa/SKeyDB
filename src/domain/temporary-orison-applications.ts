import type {AwakenerSkillRecord} from './awakener-source-schema'
import {getOrisonById, type Orison} from './orisons'

export interface TemporaryOrisonApplicationMember {
  applicationId: string
  orison: Orison
  temporaryEffect: NonNullable<
    NonNullable<
      AwakenerSkillRecord['orisonApplications']
    >[number]['members'][number]['temporaryEffect']
  >
}

export function getTemporaryOrisonApplicationMembers(
  record: Pick<AwakenerSkillRecord, 'orisonApplications'>,
): TemporaryOrisonApplicationMember[] {
  return (record.orisonApplications ?? []).flatMap((application) => {
    if (application.applicationMode !== 'TEMPORARY_ANALOG') {
      return []
    }

    return application.members.map((member) => {
      const orison = getOrisonById(member.orisonId)
      if (!orison) {
        throw new Error(
          `Temporary Orison application "${application.id}" references unknown Orison "${member.orisonId}".`,
        )
      }
      return {applicationId: application.id, orison, temporaryEffect: member.temporaryEffect}
    })
  })
}

export function buildTemporaryOrisonApplicationFooterText(
  record: Pick<AwakenerSkillRecord, 'orisonApplications'>,
): string | undefined {
  const tokens = getTemporaryOrisonApplicationMembers(record).map(
    ({orison}) => `{orison:${orison.name}}`,
  )
  return tokens.length ? tokens.join(' · ') : undefined
}
