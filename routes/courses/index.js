import { RouteNames } from '../../lib/RouteNames.js'
import {
  createCourse,
  deleteCourse,
  findCourseById,
  getAllCourses,
  updateCourse,
} from '../../lib/repositories/coursesRepository.js'
import { formatYupErrors } from '../../lib/validation/formatYupErrors.js'
import { consumeFormMethodOverride } from '../../lib/validation/stripFormMethod.js'
import { createCourseSchema } from '../../lib/schemas/createCourseSchema.js'
import { createUpdateCourseSchema } from '../../lib/schemas/updateCourseSchema.js'

function renderNewCourseForm (reply, { errors = {}, values = {} } = {}) {
  return reply.view('courses/new', { errors, values })
}

function renderEditCourseForm (reply, course, { errors = {}, values = {} } = {}) {
  const formValues = Object.keys(values).length > 0
    ? values
    : { title: course.title, description: course.description }

  return reply.view('courses/edit', { course, errors, values: formValues })
}

export default async function (fastify, opts) {
  /** PATCH /courses/:id */
  async function patchCourse (request, reply) {
    const course = findCourseById(request.params.id)

    if (!course) {
      return reply.code(404).send('Course not found')
    }

    try {
      const schema = createUpdateCourseSchema(course.id)
      const data = await schema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      })

      updateCourse(course.id, {
        title: data.title,
        description: data.description,
      })

      return reply.redirect(fastify.reverse(RouteNames.SHOW_COURSE, { id: course.id }))
    } catch (error) {
      if (error.name === 'ValidationError') {
        return renderEditCourseForm(reply.code(422), course, {
          errors: formatYupErrors(error),
          values: request.body,
        })
      }

      throw error
    }
  }

  /** DELETE /courses/:id */
  async function removeCourse (request, reply) {
    const deleted = deleteCourse(request.params.id)

    if (!deleted) {
      return reply.code(404).send('Course not found')
    }

    return reply.redirect(fastify.reverse(RouteNames.COURSES_INDEX))
  }

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

  // Более специфичный путь — регистрируем до /:id
  fastify.get('/:id/lessons/:postId', { name: RouteNames.COURSE_LESSON }, async function (request, reply) {
    const { id, postId } = request.params

    return reply.send(`Course ID: ${id}; Post ID: ${postId}`)
  })

  fastify.get('/:id/edit', { name: RouteNames.EDIT_COURSE }, async function (request, reply) {
    const course = findCourseById(request.params.id)

    if (!course) {
      return reply.code(404).send('Course not found')
    }

    return renderEditCourseForm(reply, course)
  })

  fastify.patch('/:id', { name: RouteNames.UPDATE_COURSE }, patchCourse)

  fastify.delete('/:id', { name: RouteNames.DELETE_COURSE }, removeCourse)

  /** POST + _method для HTML-форм редактирования и удаления */
  fastify.post('/:id', async function (request, reply) {
    const override = consumeFormMethodOverride(request.body)

    if (override === 'PATCH') {
      return patchCourse(request, reply)
    }

    if (override === 'DELETE') {
      return removeCourse(request, reply)
    }

    return reply.code(405).send('Method Not Allowed')
  })

  fastify.get('/:id', { name: RouteNames.SHOW_COURSE }, async function (request, reply) {
    const course = findCourseById(request.params.id)

    if (!course) {
      return reply.code(404).send('Course not found')
    }

    return reply.view('courses/show', { course })
  })
}
