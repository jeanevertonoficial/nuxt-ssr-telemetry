import { defineNuxtModule, addPlugin, addServerPlugin, addImports, createResolver } from '@nuxt/kit'
import { defu } from 'defu'

// Module options TypeScript interface definition
export interface ModuleOptions {
  enabled?: boolean
  requestIdHeader?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-ssr-telemetry',
    configKey: 'telemetry',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    enabled: true,
    requestIdHeader: 'x-request-id',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.telemetry = defu(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nuxt.options.runtimeConfig.public.telemetry as any,
      options,
    )

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Register Nitro plugin
    addServerPlugin(resolver.resolve('./runtime/server/plugins/request-id'))

    // Register useLogger auto-import
    addImports({
      name: 'useLogger',
      as: 'useLogger',
      from: resolver.resolve('./runtime/composables/useLogger'),
    })
  },
})
