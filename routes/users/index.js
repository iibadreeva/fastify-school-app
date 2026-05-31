import {
  createUser,
  findUserById,
  getAllUsers,
} from '../../lib/repositories/usersRepository.js'

export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return reply.view('users/index', { users: getAllUsers() })
  })

  fastify.get('/new', { name: 'newUser' }, async function (request, reply) {
    return reply.view('users/new')
  })

  fastify.post('/', async function (request, reply) {
    const { username, email } = request.body

    createUser({ username, email })

    return reply.redirect('/users')
  })

  fastify.get('/:id', async function (request, reply) {
    const user = findUserById(request.params.id)

    if (!user) {
      return reply.code(404).send('User not found')
    }

    return reply.view('users/show', { user })
  })
}
