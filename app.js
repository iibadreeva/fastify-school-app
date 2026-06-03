import path from 'node:path'
import AutoLoad from '@fastify/autoload'
import { fileURLToPath } from 'node:url'
import databasePlugin from './plugins/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pass --options via CLI arguments in command to enable these options.
export const options = {}

export default async function (fastify, opts) {
  // SQLite до остальных плагинов (репозитории используют getDb() при запросах)
  await fastify.register(databasePlugin)

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    ignorePattern: /^database\.js$/,
    options: Object.assign({}, opts)
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
}
