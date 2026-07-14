import { useNuxtApp } from '#app'
import type { Logger } from '../plugin'

export const useLogger = (): Logger => {
  return useNuxtApp().$logger
}
