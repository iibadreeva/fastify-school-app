import fp from 'fastify-plugin'
import middie from '@fastify/middie'

/**
 * Поддержка middleware в стиле Express/Connect (fastify.use).
 *
 * Нужен, чтобы подключать библиотеки вроде morgan, которые ожидают (req, res, next).
 * Регистрируется до plugins/request-log.js (зависимость по имени плагина).
 *
 * @see https://github.com/fastify/middie
 */
export default fp(async function middiePlugin (fastify) {
  await fastify.register(middie)
}, { name: 'middie' })
