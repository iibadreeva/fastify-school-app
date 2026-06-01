import { RouteNames } from '../../lib/RouteNames.js'

export default async function (fastify, opts) {
  fastify.get('/', { name: RouteNames.DEMO }, async function (request, reply) {
    return reply.view('demo', {
      title: 'Школьное приложение',
      message: 'Это пример HTML-страницы, собранной шаблонизатором Pug.'
    })
  })
}
