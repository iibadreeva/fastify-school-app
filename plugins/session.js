import fp from 'fastify-plugin'
import session from '@fastify/session'

/**
 * Серверные сессии: в cookie только sessionId, данные (userId) — в store на сервере.
 * Требует @fastify/cookie (plugins/cookie.js).
 *
 * @see https://github.com/fastify/session
 */
export default fp(async function sessionPlugin (fastify) {
  await fastify.register(session, {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-minimum-32-characters!!',
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    },
  })
}, { name: 'session', dependencies: ['cookie'] })
