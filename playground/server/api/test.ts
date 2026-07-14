export default defineEventHandler((event) => {
  event.context.logger.info('API route hit!')
  return { success: true, id: event.context.requestId }
})
