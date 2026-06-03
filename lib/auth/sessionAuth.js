import { RouteNames } from '../RouteNames.js'

/** Записать id пользователя в серверную сессию после входа или регистрации */
export function loginSession (request, userId) {
  request.session.userId = userId
}

/** Редирект на страницу входа, если сессии нет */
export function redirectIfGuest (request, reply) {
  if (!request.session?.userId) {
    reply.redirect(request.server.reverse(RouteNames.AUTH_LOGIN))
    return true
  }

  return false
}

/** Редирект в профиль, если уже авторизован (страницы login/register) */
export function redirectIfAuthenticated (request, reply) {
  if (request.session?.userId) {
    reply.redirect(request.server.reverse(RouteNames.AUTH_PROFILE))
    return true
  }

  return false
}
