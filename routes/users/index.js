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
  fastify.get('/', async function (request, reply) {
    return reply.view('users/index', { users: getAllUsers() })
  })

  // GET /users/new — форма создания (имя маршрута: newUser)
  fastify.get('/new', { name: 'newUser' }, async function (request, reply) {
    return renderNewUserForm(reply)
  })

  // POST /users — валидация Yup → создание или форма с ошибками (422)
  fastify.post('/', async function (request, reply) {
    try {
      const data = await createUserSchema.validate(request.body, {
        abortEarly: false, // собрать все ошибки сразу, не останавливаться на первой
        stripUnknown: true, // игнорировать лишние поля из формы
      })

      createUser({
        username: data.username,
        email: data.email,
        password: data.password,
      })

      return reply.redirect('/users')
    } catch (error) {
      if (error.name === 'ValidationError') {
        return renderNewUserForm(reply.code(422), {
          errors: formatYupErrors(error),
          values: request.body, // вернуть username и email в поля формы
        })
      }

      throw error
    }
  })

  // маршрут /:id должен быть после /new, иначе "new" воспримется как id
  fastify.get('/:id', async function (request, reply) {
    const user = findUserById(request.params.id)

    if (!user) {
      return reply.code(404).send('User not found')
    }

    return reply.view('users/show', { user })
  })
}
