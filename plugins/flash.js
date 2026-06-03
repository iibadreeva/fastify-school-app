import fp from 'fastify-plugin'
import flash from '@fastify/flash'

/**
 * Flash-сообщения в сессии (один раз после redirect).
 * Требует @fastify/session — данные хранятся в request.session.
 *
 * @see https://github.com/fastify/flash
 */
export default fp(async function flashPlugin (fastify) {
  await fastify.register(flash)
}, { name: 'flash', dependencies: ['session'] })
