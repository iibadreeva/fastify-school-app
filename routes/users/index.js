import { RouteNames } from '../../lib/RouteNames.js'
import { createUserSchema } from '../../lib/schemas/createUserSchema.js'
import { createUpdateUserSchema } from '../../lib/schemas/updateUserSchema.js'
import {
  createUser,
  deleteUser,
  findUserById,
  getAllUsers,
  updateUser,
} from '../../lib/repositories/usersRepository.js'
import { formatYupErrors } from '../../lib/validation/formatYupErrors.js'
import { consumeFormMethodOverride } from '../../lib/validation/stripFormMethod.js'

/** Форма создания; при 422 — errors и values для повторного рендера */
function renderNewUserForm (reply, { errors = {}, values = {} } = {}) {
  return reply.view('users/new', { errors, values })
}

/** Форма редактирования; values из user или из тела запроса после ошибки валидации */
function renderEditUserForm (reply, user, { errors = {}, values = {} } = {}) {
  const formValues = Object.keys(values).length > 0
    ? values
    : { username: user.username, email: user.email }

  return reply.view('users/edit', { user, errors, values: formValues })
}

export default async function (fastify, opts) {
  /** PATCH /users/:id — обновление; пароль меняется только если поле заполнено */
  async function patchUser (request, reply) {
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

      return reply.redirect(fastify.reverse(RouteNames.SHOW_USER, { id: user.id }))
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

  /** DELETE /users/:id — удаление и редирект на список */
  async function removeUser (request, reply) {
    const deleted = deleteUser(request.params.id)

    if (!deleted) {
      return reply.code(404).send('User not found')
    }

    return reply.redirect(fastify.reverse(RouteNames.USERS_INDEX))
  }

  fastify.get('/', { name: RouteNames.USERS_INDEX }, async function (request, reply) {
    return reply.view('users/index', { users: getAllUsers() })
  })

  fastify.get('/new', { name: RouteNames.NEW_USER }, async function (request, reply) {
    return renderNewUserForm(reply)
  })

  fastify.post('/', { name: RouteNames.CREATE_USER }, async function (request, reply) {
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

      return reply.redirect(fastify.reverse(RouteNames.USERS_INDEX))
    } catch (error) {
      if (error.name === 'ValidationError') {
        return renderNewUserForm(reply.code(422), {
          errors: formatYupErrors(error),
          values: request.body,
        })
      }

      throw error
    }
  })

  // До /:id — иначе сегмент "edit" воспримется как id
  fastify.get('/:id/edit', { name: RouteNames.EDIT_USER }, async function (request, reply) {
    const user = findUserById(request.params.id)

    if (!user) {
      return reply.code(404).send('User not found')
    }

    return renderEditUserForm(reply, user)
  })

  fastify.patch('/:id', { name: RouteNames.UPDATE_USER }, patchUser)

  fastify.delete('/:id', { name: RouteNames.DELETE_USER }, removeUser)

  /**
   * HTML-формы шлют только POST. Скрытое поле _method=PATCH|DELETE
   * перенаправляет на patchUser / removeUser (см. stripFormMethod.js).
   */
  fastify.post('/:id', async function (request, reply) {
    const override = consumeFormMethodOverride(request.body)

    if (override === 'PATCH') {
      return patchUser(request, reply)
    }

    if (override === 'DELETE') {
      return removeUser(request, reply)
    }

    return reply.code(405).send('Method Not Allowed')
  })

  fastify.get('/:id', { name: RouteNames.SHOW_USER }, async function (request, reply) {
    const user = findUserById(request.params.id)

    if (!user) {
      return reply.code(404).send('User not found')
    }

    return reply.view('users/show', { user })
  })
}
