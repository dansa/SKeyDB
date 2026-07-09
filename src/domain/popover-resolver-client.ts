import {resolveDescriptionTemplate, type DescriptionArgResolveContext} from './description-args'
import {
  resolveDescribedRecord,
  type DescribedRecord,
  type ResolvedDescribedRecord,
} from './description-records'
import type {PublicDescriptionArg} from './public-description-args'

interface WorkerResponse {
  id: number
  success: boolean
  result: unknown
  error?: string
}

let workerInstance: Worker | null = null
const pendingRequests = new Map<
  number,
  {resolve: (val: unknown) => void; reject: (err: Error) => void}
>()
let nextRequestId = 0

const getIsTestEnv = (): boolean => {
  if (typeof globalThis === 'undefined') return false
  const g = globalThis as Record<string, unknown>
  if (!g.process || typeof g.process !== 'object') return false
  const p = g.process as Record<string, unknown>
  if (!p.env || typeof p.env !== 'object') return false
  const e = p.env as Record<string, unknown>
  return e.NODE_ENV === 'test'
}
const isTestEnv = getIsTestEnv()
const isWorkerSupported = typeof Worker !== 'undefined' && !isTestEnv

function getWorker(): Worker | null {
  if (!isWorkerSupported) {
    return null
  }

  if (!workerInstance) {
    workerInstance = new Worker(new URL('./popover-resolver.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerInstance.onmessage = (event: MessageEvent) => {
      const {id, success, result, error} = event.data as WorkerResponse
      const request = pendingRequests.get(id)
      if (request) {
        pendingRequests.delete(id)
        if (success) {
          request.resolve(result)
        } else {
          request.reject(new Error(error))
        }
      }
    }
  }

  return workerInstance
}

export function resolveDescriptionTemplateAsync(
  descriptionTemplate: string,
  descriptionArgs: Record<string, PublicDescriptionArg>,
  context: DescriptionArgResolveContext = {},
): Promise<string> {
  const worker = getWorker()
  if (!worker) {
    return Promise.resolve(
      resolveDescriptionTemplate(descriptionTemplate, descriptionArgs, context),
    )
  }

  return new Promise<string>((resolve, reject) => {
    const id = nextRequestId++
    pendingRequests.set(id, {
      resolve: (val) => {
        resolve(val as string)
      },
      reject,
    })
    worker.postMessage({
      id,
      type: 'resolveDescriptionTemplate',
      payload: {descriptionTemplate, descriptionArgs, context},
    })
  })
}

export function resolveDescribedRecordAsync<TRecord extends DescribedRecord>(
  record: TRecord,
  resolveContext: DescriptionArgResolveContext = {},
  progressionContext = {},
): Promise<ResolvedDescribedRecord<TRecord>> {
  const worker = getWorker()
  if (!worker) {
    return Promise.resolve(resolveDescribedRecord(record, resolveContext, progressionContext))
  }

  return new Promise<ResolvedDescribedRecord<TRecord>>((resolve, reject) => {
    const id = nextRequestId++
    pendingRequests.set(id, {
      resolve: (val) => {
        resolve(val as ResolvedDescribedRecord<TRecord>)
      },
      reject,
    })
    worker.postMessage({
      id,
      type: 'resolveDescribedRecord',
      payload: {record, resolveContext, progressionContext},
    })
  })
}
