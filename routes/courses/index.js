import { RouteNames } from '../../lib/RouteNames.js'
import * as coursesController from '../../lib/controllers/coursesController.js'

/**
 * Маршруты курсов (/courses).
 * Логика — в lib/controllers/coursesController.js
 */
export default async function (fastify, opts) {
  fastify.get('/', { name: RouteNames.COURSES_INDEX }, coursesController.index)
  fastify.get('/new', { name: RouteNames.NEW_COURSE }, coursesController.newForm)
  fastify.post('/', { name: RouteNames.CREATE_COURSE }, coursesController.create)

  fastify.get('/:id/lessons/:postId', { name: RouteNames.COURSE_LESSON }, coursesController.lesson)
  fastify.get('/:id/edit', { name: RouteNames.EDIT_COURSE }, coursesController.editForm)
  fastify.patch('/:id', { name: RouteNames.UPDATE_COURSE }, coursesController.update)
  fastify.delete('/:id', { name: RouteNames.DELETE_COURSE }, coursesController.destroy)
  fastify.post('/:id', coursesController.handleMemberAction)

  fastify.get('/:id', { name: RouteNames.SHOW_COURSE }, coursesController.show)
}
