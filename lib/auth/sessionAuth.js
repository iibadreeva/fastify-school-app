import { RouteNames } from '../RouteNames.js'
import { setFlashError, setFlashSuccess } from '../flash/flashMessages.js'

/** Записать id пользователя в серверную сессию после входа или регистрации */
export function loginSession (request, userId) {
  request.session.userId = userId
}

/** Редирект на страницу входа, если сессии нет */
export function redirectIfGuest (request, reply) {
  if (!request.session?.userId) {
    // flash сохраняется в сессии — сработает, если сессия уже есть (например после logout)
    if (request.session) {
      setFlashError(request, 'Войдите, чтобы продолжить.')
    }

    reply.redirect(request.server.reverse(RouteNames.AUTH_LOGIN))
    return true
  }

  return false
}

/** Редирект в профиль, если уже авторизован (страницы login/register) */
export function redirectIfAuthenticated (request, reply) {
  if (request.session?.userId) {
    setFlashSuccess(request, 'Вы уже вошли в систему.')

    reply.redirect(request.server.reverse(RouteNames.AUTH_PROFILE))
    return true
  }

  return false
}
