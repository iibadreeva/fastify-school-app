import fp from 'fastify-plugin'
import cookie from '@fastify/cookie'

/**
 * Парсинг Cookie из запроса и установка Set-Cookie в ответе.
 *
 * Декораторы: request.cookies, reply.setCookie(), reply.clearCookie().
 * secret — для подписанных cookie (signed: true); в production задайте COOKIE_SECRET.
 *
 * @see https://github.com/fastify/fastify-cookie
 */
export default fp(async function cookiePlugin (fastify) {
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-production',
  })
}, { name: 'cookie' })
