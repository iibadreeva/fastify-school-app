import fp from 'fastify-plugin'
import { closeDatabase, openDatabase } from '../lib/db/connection.js'

/**
 * SQLite: схема, сиды и закрытие при остановке приложения.
 * Путь: DATABASE_PATH или data/app.sqlite (в тестах — :memory:).
 */
export default fp(async function databasePlugin (fastify) {
  await openDatabase()

  fastify.addHook('onClose', async () => {
    await closeDatabase()
  })
}, { name: 'database' })
