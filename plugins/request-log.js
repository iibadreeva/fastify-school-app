import fp from 'fastify-plugin'
import morgan from 'morgan'

/**
 * Access log в консоль: метод, URL, статус, время ответа.
 *
 * Работает только вместе с @fastify/middie (plugins/middie.js).
 * В production отключён: там достаточно встроенного Pino (fastify.log).
 *
 * @see https://github.com/expressjs/morgan
 */
export default fp(async function requestLogPlugin (fastify) {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    return
  }

  // dev — цветной краткий формат: GET /users 200 12.345 ms - 1234
  fastify.use(morgan('dev'))
}, { name: 'request-log', dependencies: ['middie'] })
