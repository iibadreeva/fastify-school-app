import fp from 'fastify-plugin'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Статика Bootstrap для Pug-шаблонов (/assets/bootstrap.min.css).
 */
export default fp(async function (fastify) {
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist', 'css'),
    prefix: '/assets/'
  })
})
