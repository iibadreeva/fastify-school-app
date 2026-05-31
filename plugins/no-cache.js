import fp from 'fastify-plugin'

/**
 * Запрещает кэширование ответов браузером и промежуточными прокси.
 *
 * На каждый ответ добавляется заголовок Cache-Control: no-store — данные
 * (HTML-страницы, JSON, редиректы) не сохраняются в disk/memory cache.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 */
export default fp(async function noCachePlugin (fastify) {
  fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('Cache-Control', 'no-store')
    return payload
  })
})
