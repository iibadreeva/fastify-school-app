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
  fastify.get('/', async function (request, reply) {
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

  fastify.get('/new', { name: 'newCourse' }, async function (request, reply) {
    return renderNewCourseForm(reply)
  })

  fastify.post('/', async function (request, reply) {
    try {
      const data = await createCourseSchema.validate(request.body, {
        abortEarly: false, // собрать все ошибки сразу, не останавливаться на первой
        stripUnknown: true, // игнорировать лишние поля из формы
      })

      createCourse({
        title: data.title,
        description: data.description
      })

      return reply.redirect('/courses')
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

  fastify.get('/:id/lessons/:postId', async function (request, reply) {
    const { id, postId } = request.params

    return reply.send(`Course ID: ${id}; Post ID: ${postId}`)
  })
}
