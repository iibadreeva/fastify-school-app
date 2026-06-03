import { RouteNames } from '../RouteNames.js'
import { createUserSchema } from '../schemas/createUserSchema.js'
import { createUpdateUserSchema } from '../schemas/updateUserSchema.js'
import {
  createUser,
  deleteUser,
  findUserById,
  getUsersPage,
  updateUser,
} from '../repositories/usersRepository.js'
 import { redirectIfGuest } from '../auth/sessionAuth.js'
import { formatYupErrors } from '../validation/formatYupErrors.js'
import { consumeFormMethodOverride } from '../validation/stripFormMethod.js'

function renderNewUserForm (reply, { errors = {}, values = {} } = {}) {
  return reply.view('users/new', { errors, values })
}

function renderEditUserForm (reply, user, { errors = {}, values = {} } = {}) {
  const formValues = Object.keys(values).length > 0
    ? values
    : { username: user.username, email: user.email }

  return reply.view('users/edit', { user, errors, values: formValues })
}

/** GET /users — список с пейджингом (?page=1, по 10 записей) */
export async function index (request, reply) {
  const page = Number.parseInt(request.query.page, 10) || 1
  const pagination = getUsersPage(page)

  const listUrl = request.server.reverse(RouteNames.USERS_INDEX)

  return reply.view('users/index', {
    users: pagination.users,
    page: pagination.page,
    totalPages: pagination.totalPages,
    hasPrev: pagination.hasPrev,
    hasNext: pagination.hasNext,
    prevUrl: pagination.hasPrev ? `${listUrl}?page=${pagination.page - 1}` : null,
    nextUrl: pagination.hasNext ? `${listUrl}?page=${pagination.page + 1}` : null,
  })
}

/** GET /users/new — только для авторизованных */
export async function newForm (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  return renderNewUserForm(reply)
}

/** POST /users — только для авторизованных */
export async function create (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  try {
    const data = await createUserSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    createUser({
      username: data.username,
      email: data.email,
      password: data.password,
    })

    return reply.redirect(request.server.reverse(RouteNames.USERS_INDEX))
  } catch (error) {
    if (error.name === 'ValidationError') {
      return renderNewUserForm(reply.code(422), {
        errors: formatYupErrors(error),
        values: request.body,
      })
    }

    throw error
  }
}

/** GET /users/:id */
export async function show (request, reply) {
  const user = findUserById(request.params.id)

  if (!user) {
    return reply.code(404).send('User not found')
  }

  return reply.view('users/show', { user })
}

/** GET /users/:id/edit */
export async function editForm (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const user = findUserById(request.params.id)

  if (!user) {
    return reply.code(404).send('User not found')
  }

  return renderEditUserForm(reply, user)
}

/** PATCH /users/:id */
export async function update (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const user = findUserById(request.params.id)

  if (!user) {
    return reply.code(404).send('User not found')
  }

  try {
    const schema = createUpdateUserSchema(user.id)
    const data = await schema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    updateUser(user.id, {
      username: data.username,
      email: data.email,
      password: data.password,
    })

    return reply.redirect(
      request.server.reverse(RouteNames.SHOW_USER, { id: user.id })
    )
  } catch (error) {
    if (error.name === 'ValidationError') {
      return renderEditUserForm(reply.code(422), user, {
        errors: formatYupErrors(error),
        values: request.body,
      })
    }

    throw error
  }
}

/** DELETE /users/:id */
export async function destroy (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const deleted = deleteUser(request.params.id)

  if (!deleted) {
    return reply.code(404).send('User not found')
  }

  return reply.redirect(request.server.reverse(RouteNames.USERS_INDEX))
}

/** POST /users/:id — HTML-формы с _method=PATCH|DELETE */
export async function handleMemberAction (request, reply) {
  const override = consumeFormMethodOverride(request.body)

  if (override === 'PATCH') {
    return update(request, reply)
  }

  if (override === 'DELETE') {
    return destroy(request, reply)
  }

  return reply.code(405).send('Method Not Allowed')
}
