import fp from 'fastify-plugin'
import { findUserById } from '../lib/repositories/usersRepository.js'

/**
 * Добавляет currentUser в reply.locals для всех Pug-шаблонов (шапка: вход / профиль).
 * Если userId в сессии устарел — сессия уничтожается.
 */
export default fp(async function authContextPlugin (fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    let currentUser = null
    const userId = request.session?.userId

    if (userId) {
      const user = findUserById(userId)

      if (user) {
        currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      } else {
        await request.session.destroy()
      }
    }

    reply.locals = { ...reply.locals, currentUser }
  })
}, { name: 'auth-context', dependencies: ['session'] })
