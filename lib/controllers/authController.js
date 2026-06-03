import { RouteNames } from '../RouteNames.js'
import {
  loginSession,
  redirectIfAuthenticated,
  redirectIfGuest,
} from '../auth/sessionAuth.js'
import { createUserSchema } from '../schemas/createUserSchema.js'
import { loginSchema } from '../schemas/loginSchema.js'
import {
  createUser,
  findUserByEmail,
} from '../repositories/usersRepository.js'
import verifyPassword from '../verifyPassword.js'
import { formatYupErrors } from '../validation/formatYupErrors.js'
import {
  flashMessagesForView,
  setFlashError,
  setFlashSuccess,
} from '../flash/flashMessages.js'

function renderLogin (reply, { errors = {}, values = {} } = {}) {
  return reply.view('auth/login', { errors, values, flashMessages: flashMessagesForView(reply) })
}

function renderRegister (reply, { errors = {}, values = {} } = {}) {
  return reply.view('auth/register', {
    errors,
    values,
    flashMessages: flashMessagesForView(reply),
  })
}

/** GET /auth/login */
export async function loginForm (request, reply) {
  if (redirectIfAuthenticated(request, reply)) {
    return
  }

  return renderLogin(reply)
}

/** POST /auth/login */
export async function login (request, reply) {
  if (redirectIfAuthenticated(request, reply)) {
    return
  }

  try {
    const data = await loginSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    const user = await findUserByEmail(data.email)

    if (!user || !verifyPassword(data.password, user.password)) {
      setFlashError(request, 'Неверный email или пароль.')

      return renderLogin(reply.code(422), {
        errors: { _form: 'Неверный email или пароль' },
        values: { email: data.email },
      })
    }

    loginSession(request, user.id)
    setFlashSuccess(request, 'Вы успешно вошли в систему.')

    return reply.redirect(request.server.reverse(RouteNames.AUTH_PROFILE))
  } catch (error) {
    if (error.name === 'ValidationError') {
      setFlashError(request, 'Проверьте email и пароль.')

      return renderLogin(reply.code(422), {
        errors: formatYupErrors(error),
        values: request.body,
      })
    }

    throw error
  }
}

/** GET /auth/register */
export async function registerForm (request, reply) {
  if (redirectIfAuthenticated(request, reply)) {
    return
  }

  return renderRegister(reply)
}

/** POST /auth/register */
export async function register (request, reply) {
  if (redirectIfAuthenticated(request, reply)) {
    return
  }

  try {
    const data = await createUserSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    const user = await createUser({
      username: data.username,
      email: data.email,
      password: data.password,
    })

    loginSession(request, user.id)
    setFlashSuccess(request, 'Аккаунт создан. Добро пожаловать!')

    return reply.redirect(request.server.reverse(RouteNames.AUTH_PROFILE))
  } catch (error) {
    if (error.name === 'ValidationError') {
      setFlashError(request, 'Не удалось зарегистрироваться. Проверьте форму.')

      return renderRegister(reply.code(422), {
        errors: formatYupErrors(error),
        values: request.body,
      })
    }

    if (error.code === 'SQLITE_CONSTRAINT') {
      setFlashError(request, 'Пользователь с таким email уже существует.')

      return renderRegister(reply.code(422), {
        errors: { email: 'Пользователь с таким email уже существует' },
        values: request.body,
      })
    }

    request.log.error(error)
    throw error
  }
}

/** POST /auth/logout */
export async function logout (request, reply) {
  delete request.session.userId
  setFlashSuccess(request, 'Вы вышли из системы.')

  return reply.redirect(request.server.reverse(RouteNames.HOME))
}

/** GET /auth/profile — только для авторизованных */
export async function profile (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const user = reply.locals.currentUser

  return reply.view('auth/profile', { user })
}
