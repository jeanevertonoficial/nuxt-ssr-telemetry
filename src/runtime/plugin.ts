import { defineNuxtPlugin, useRequestHeaders, useRequestEvent, useState, useRuntimeConfig } from '#app'

export interface Logger {
  info: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
}

export default defineNuxtPlugin((_nuxtApp) => {
  const config = useRuntimeConfig()?.public?.telemetry as { enabled?: boolean, requestIdHeader?: string }

  const requestIdState = useState<string>('request-id', () => {
    if (config?.enabled === false) {
      return ''
    }
    if (import.meta.server) {
      const event = useRequestEvent()
      if (event?.context.requestId) {
        return event.context.requestId
      }
    }
    const headerName = config?.requestIdHeader || 'x-request-id'
    const headers = useRequestHeaders([headerName]) as Record<string, string | undefined>
    return headers[headerName] || ''
  })

  const requestId = requestIdState.value

  const logger: Logger = {
    info: (...args: unknown[]) => {
      if (config?.enabled !== false) {
        console.log(`[${requestId}]`, ...args)
      }
    },
    error: (...args: unknown[]) => {
      if (config?.enabled !== false) {
        console.error(`[${requestId}]`, ...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (config?.enabled !== false) {
        console.warn(`[${requestId}]`, ...args)
      }
    },
  }

  return {
    provide: {
      logger,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $logger: Logger
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $logger: Logger
  }
}
