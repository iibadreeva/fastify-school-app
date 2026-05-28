export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return reply.view('demo', {
      title: 'Школьное приложение',
      message: 'Это пример HTML-страницы, собранной шаблонизатором Pug.'
    })
  })
}
