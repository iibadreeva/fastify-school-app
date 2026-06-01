import { RouteNames } from '../../lib/RouteNames.js'
import { createUserSchema } from '../../lib/schemas/createUserSchema.js'
import {
  createUser,
  findUserById,
  getAllUsers,
} from '../../lib/repositories/usersRepository.js'
import { formatYupErrors } from '../../lib/validation/formatYupErrors.js'

/** Рендер формы; errors и values нужны при повторном показе после ошибок валидации */
function renderNewUserForm (reply, { errors = {}, values = {} } = {}) {
  return reply.view('users/new', { errors, values })
}

export default async function (fastify, opts) {
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

  fastify.get('/:id', { name: RouteNames.SHOW_USER }, async function (request, reply) {
    const user = findUserById(request.params.id)

    if (!user) {
      return reply.code(404).send('User not found')
    }

    return reply.view('users/show', { user })
  })
}
