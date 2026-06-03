import { RouteNames } from '../../lib/RouteNames.js'

const DEMO_VISITS_COOKIE = 'demo_visits'

function getDemoVisits (request) {
  const raw = request.cookies[DEMO_VISITS_COOKIE]
  if (!raw) return 0

  // проверяет и расшифровывает подписанную cookie
  const unsigned = request.unsignCookie(raw)
  if (!unsigned.valid) return 0

  return Number.parseInt(unsigned.value, 10) || 0
}

export default async function (fastify, opts) {
  /**
   * Демо @fastify/cookie: счётчик визитов в подписанной cookie.
   * Каждый GET /demo увеличивает счётчик и отдаёт Set-Cookie.
   */
  fastify.get('/', { name: RouteNames.DEMO }, async function (request, reply) {
    const visits = getDemoVisits(request) + 1

    reply.setCookie(DEMO_VISITS_COOKIE, String(visits), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      signed: true,
    })

    return reply.view('demo', {
      title: 'Школьное приложение',
      message: 'Это пример HTML-страницы, собранной шаблонизатором Pug.',
      visits,
    })
  })
}
