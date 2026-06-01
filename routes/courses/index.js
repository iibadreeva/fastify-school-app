import { RouteNames } from '../../lib/RouteNames.js'
import {
  createCourse,
  getAllCourses,
} from '../../lib/repositories/coursesRepository.js'
import { formatYupErrors } from '../../lib/validation/formatYupErrors.js'
import { createCourseSchema } from '../../lib/schemas/createCourseSchema.js'

function renderNewCourseForm (reply, { errors = {}, values = {} } = {}) {
  return reply.view('courses/new', { errors, values })
}

export default async function (fastify, opts) {
  fastify.get('/', { name: RouteNames.COURSES_INDEX }, async function (request, reply) {
    const { q = '' } = request.query
    const filterQuery = q.trim()
    const query = filterQuery.toLowerCase()
    const courses = filterQuery
      ? getAllCourses().filter((course) =>
          course.title.toLowerCase().includes(query)
          || course.description.toLowerCase().includes(query)
        )
      : getAllCourses()

    return reply.view('courses/index', {
      courses,
      filterQuery,
      header: 'Курсы по программированию',
    })
  })

  fastify.get('/new', { name: RouteNames.NEW_COURSE }, async function (request, reply) {
    return renderNewCourseForm(reply)
  })

  fastify.post('/', { name: RouteNames.CREATE_COURSE }, async function (request, reply) {
    try {
      const data = await createCourseSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      })

      createCourse({
        title: data.title,
        description: data.description,
      })

      return reply.redirect(fastify.reverse(RouteNames.COURSES_INDEX))
    } catch (error) {
      if (error.name === 'ValidationError') {
        return renderNewCourseForm(reply.code(422), {
          errors: formatYupErrors(error),
          values: request.body,
        })
      }

      throw error
    }
  })

  fastify.get('/:id/lessons/:postId', { name: RouteNames.COURSE_LESSON }, async function (request, reply) {
    const { id, postId } = request.params

    return reply.send(`Course ID: ${id}; Post ID: ${postId}`)
  })
}
