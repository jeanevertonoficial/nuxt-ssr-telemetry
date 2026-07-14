import { defineNitroPlugin } from 'nitropack/runtime'
import { randomUUID } from 'uncrypto'
import { logger } from '../utils/logger'
import { useRuntimeConfig } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const config = useRuntimeConfig()?.public?.telemetry as { enabled?: boolean, requestIdHeader?: string }

    if (config?.enabled === false) {
      event.context.requestId = ''
      event.context.logger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      }
      return
    }

    const headerName = config?.requestIdHeader || 'x-request-id'
    const headerValue = event.node.req.headers[headerName] || event.node.req.headers[headerName.toLowerCase()]
    const requestId = (headerValue || randomUUID()) as string

    event.context.requestId = requestId
    event.context.logger = logger.child({ requestId })
  })
})

export interface TelemetryLogger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

declare module 'h3' {
  interface H3EventContext {
    requestId: string
    logger: TelemetryLogger
  }
}
