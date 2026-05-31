import fp from 'fastify-plugin'
import formbody from '@fastify/formbody'

/**
 * Парсинг тел запросов с Content-Type: application/x-www-form-urlencoded.
 *
 * @see https://github.com/fastify/fastify-formbody
 */
export default fp(async (fastify) => {
  await fastify.register(formbody)
})
