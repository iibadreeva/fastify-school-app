import fp from 'fastify-plugin'
import view from '@fastify/view'
import pug from 'pug'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Подключение шаблонизатора Pug через @fastify/view.
 *
 * @see https://github.com/fastify/point-of-view
 */
export default fp(async function (fastify) {
  await fastify.register(view, {
    engine: { pug },
    root: path.join(__dirname, '..', 'views'),
    includeViewExtension: true
  })
})
