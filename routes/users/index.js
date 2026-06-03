import { RouteNames } from '../../lib/RouteNames.js'
import * as usersController from '../../lib/controllers/usersController.js'

/**
 * Маршруты пользователей (/users).
 * Логика — в lib/controllers/usersController.js
 * GET/POST /users/new и POST / — только для авторизованных (см. redirectIfGuest).
 */
export default async function (fastify, opts) {
  fastify.get('/', { name: RouteNames.USERS_INDEX }, usersController.index)
  fastify.get('/new', { name: RouteNames.NEW_USER }, usersController.newForm)
  fastify.post('/', { name: RouteNames.CREATE_USER }, usersController.create)

  fastify.get('/:id/edit', { name: RouteNames.EDIT_USER }, usersController.editForm)
  fastify.patch('/:id', { name: RouteNames.UPDATE_USER }, usersController.update)
  fastify.delete('/:id', { name: RouteNames.DELETE_USER }, usersController.destroy)
  fastify.post('/:id', usersController.handleMemberAction)

  fastify.get('/:id', { name: RouteNames.SHOW_USER }, usersController.show)
}
