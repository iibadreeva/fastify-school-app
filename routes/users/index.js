import getUsers from '../../lib/getUsers.js'

const users = getUsers()

export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return reply.view('users/index', { users })
  })

  fastify.get('/:id', async function (request, reply) {
    const user = users.find((u) => u.id === request.params.id)

    if (!user) {
      return reply.code(404).send('User not found')
    }

    return reply.view('users/show', { user })
  })
}
