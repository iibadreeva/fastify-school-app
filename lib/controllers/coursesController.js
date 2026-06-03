import { RouteNames } from '../RouteNames.js'
import {
  createCourse,
  deleteCourse,
  findCourseById,
  getAllCourses,
  updateCourse,
} from '../repositories/coursesRepository.js'
import { formatYupErrors } from '../validation/formatYupErrors.js'
import { consumeFormMethodOverride } from '../validation/stripFormMethod.js'
import { createCourseSchema } from '../schemas/createCourseSchema.js'
import { createUpdateCourseSchema } from '../schemas/updateCourseSchema.js'
import { redirectIfGuest } from '../auth/sessionAuth.js'
import {
  flashMessagesForView,
  setFlashError,
  setFlashSuccess,
} from '../flash/flashMessages.js'

function renderNewCourseForm (reply, { errors = {}, values = {} } = {}) {
  return reply.view('courses/new', {
    errors,
    values,
    flashMessages: flashMessagesForView(reply),
  })
}

function renderEditCourseForm (reply, course, { errors = {}, values = {} } = {}) {
  const formValues = Object.keys(values).length > 0
    ? values
    : { title: course.title, description: course.description }

  return reply.view('courses/edit', {
    course,
    errors,
    values: formValues,
    flashMessages: flashMessagesForView(reply),
  })
}

/** GET /courses */
export async function index (request, reply) {
  const { q = '' } = request.query
  const filterQuery = q.trim()
  const query = filterQuery.toLowerCase()
  const allCourses = await getAllCourses()
  const courses = filterQuery
    ? allCourses.filter((course) =>
        course.title.toLowerCase().includes(query)
        || course.description.toLowerCase().includes(query)
      )
    : allCourses

  return reply.view('courses/index', {
    courses,
    filterQuery,
    header: 'Курсы по программированию',
  })
}

/** GET /courses/new */
export async function newForm (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }
  return renderNewCourseForm(reply)
}

/** POST /courses */
export async function create (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  try {
    const data = await createCourseSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    await createCourse({
      title: data.title,
      description: data.description,
    })

    setFlashSuccess(request, 'Курс успешно добавлен.')
    return reply.redirect(request.server.reverse(RouteNames.COURSES_INDEX))
  } catch (error) {
    if (error.name === 'ValidationError') {
      setFlashError(request, 'Не удалось добавить курс. Исправьте ошибки в форме.')

      return renderNewCourseForm(reply.code(422), {
        errors: formatYupErrors(error),
        values: request.body,
      })
    }

    throw error
  }
}

/** GET /courses/:id */
export async function show (request, reply) {
  const course = await findCourseById(request.params.id)

  if (!course) {
    return reply.code(404).send('Course not found')
  }

  return reply.view('courses/show', { course })
}

/** GET /courses/:id/edit */
export async function editForm (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const course = await findCourseById(request.params.id)

  if (!course) {
    return reply.code(404).send('Course not found')
  }

  return renderEditCourseForm(reply, course)
}

/** PATCH /courses/:id */
export async function update (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const course = await findCourseById(request.params.id)

  if (!course) {
    return reply.code(404).send('Course not found')
  }

  try {
    const schema = createUpdateCourseSchema(course.id)
    const data = await schema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    await updateCourse(course.id, {
      title: data.title,
      description: data.description,
    })

    setFlashSuccess(request, 'Курс обновлён.')
    return reply.redirect(
      request.server.reverse(RouteNames.SHOW_COURSE, { id: course.id })
    )
  } catch (error) {
    if (error.name === 'ValidationError') {
      setFlashError(request, 'Не удалось сохранить изменения. Проверьте форму.')

      return renderEditCourseForm(reply.code(422), course, {
        errors: formatYupErrors(error),
        values: request.body,
      })
    }

    throw error
  }
}

/** DELETE /courses/:id */
export async function destroy (request, reply) {
  if (redirectIfGuest(request, reply)) {
    return
  }

  const deleted = await deleteCourse(request.params.id)

  if (!deleted) {
    setFlashError(request, 'Курс не найден.')
    return reply.redirect(request.server.reverse(RouteNames.COURSES_INDEX))
  }

  setFlashSuccess(request, 'Курс удалён.')
  return reply.redirect(request.server.reverse(RouteNames.COURSES_INDEX))
}

/** GET /courses/:id/lessons/:postId — публичный пример вложенного маршрута */
export async function lesson (request, reply) {
  const { id, postId } = request.params

  return reply.send(`Course ID: ${id}; Post ID: ${postId}`)
}

/** POST /courses/:id — HTML-формы с _method=PATCH|DELETE */
export async function handleMemberAction (request, reply) {
  const override = consumeFormMethodOverride(request.body)

  if (override === 'PATCH') {
    return update(request, reply)
  }

  if (override === 'DELETE') {
    return destroy(request, reply)
  }

  return reply.code(405).send('Method Not Allowed')
}
