import fp from 'fastify-plugin'
import { getFlashMessages } from '../lib/flash/flashMessages.js'
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
      const user = await findUserById(userId)

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

    // flash с прошлого redirect (после регистрации, создания пользователя и т.д.)
    reply.locals = {
      ...reply.locals,
      currentUser,
      flashMessages: getFlashMessages(reply),
    }
  })
}, { name: 'auth-context', dependencies: ['database', 'session', 'flash'] })
