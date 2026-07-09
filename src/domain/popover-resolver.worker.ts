import {resolveDescriptionTemplate, type DescriptionArgResolveContext} from './description-args'
import {resolveDescribedRecord, type DescribedRecord} from './description-records'
import type {PublicDescriptionArg} from './public-description-args'

interface ResolveDescriptionTemplateRequest {
  id: number
  type: 'resolveDescriptionTemplate'
  payload: {
    descriptionTemplate: string
    descriptionArgs: Record<string, PublicDescriptionArg>
    context: DescriptionArgResolveContext
  }
}

interface ResolveDescribedRecordRequest {
  id: number
  type: 'resolveDescribedRecord'
  payload: {
    record: DescribedRecord
    resolveContext: DescriptionArgResolveContext
    progressionContext: Record<string, unknown>
  }
}

self.onmessage = (event: MessageEvent) => {
  const request = event.data as {id: number; type: string; payload: unknown}
  const {id, type} = request

  try {
    if (type === 'resolveDescriptionTemplate') {
      const {payload} = request as ResolveDescriptionTemplateRequest
      const result = resolveDescriptionTemplate(
        payload.descriptionTemplate,
        payload.descriptionArgs,
        payload.context,
      )
      self.postMessage({id, success: true, result})
    } else if (type === 'resolveDescribedRecord') {
      const {payload} = request as ResolveDescribedRecordRequest
      const result = resolveDescribedRecord(
        payload.record,
        payload.resolveContext,
        payload.progressionContext,
      )
      self.postMessage({id, success: true, result})
    } else {
      self.postMessage({id, success: false, error: `Unknown request type: ${type}`})
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    self.postMessage({id, success: false, error: message})
  }
}
