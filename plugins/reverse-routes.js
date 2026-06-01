import fp from 'fastify-plugin'
import { compile } from 'path-to-regexp'

/**
 * Именованные маршруты (API как у fastify-reverse-routes: fastify.reverse).
 * Карта имён хранится на инстансе Fastify, а не глобально — корректно в тестах.
 * HEAD-копии маршрутов не регистрируем.
 *
 * @see https://github.com/dimonnwc3/fastify-reverse-routes
 */
export default fp(async function (fastify) {
  const routes = new Map()

  fastify.decorate('reverse', function reverse (name, args = {}, opts) {
    const toPath = routes.get(name)

    if (!toPath) {
      throw new Error(`Route with name ${name} is not registered`)
    }

    return toPath(args, opts)
  })

  fastify.addHook('onRoute', (routeOptions) => {
    if (!routeOptions.name) {
      return
    }

    const methods = Array.isArray(routeOptions.method)
      ? routeOptions.method
      : [routeOptions.method]

    if (methods.includes('HEAD')) {
      return
    }

    routes.set(routeOptions.name, compile(routeOptions.url))
  })
}, { name: 'reverse-routes' })
