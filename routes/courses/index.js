import {
  createCourse,
  getAllCourses,
} from '../../lib/repositories/coursesRepository.js'

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
    return reply.view('courses/new')
  })

  fastify.post('/', async function (request, reply) {
    const { title, description } = request.body

    createCourse({ title, description })

    return reply.redirect('/courses')
  })

  fastify.get('/:id/lessons/:postId', async function (request, reply) {
    const { id, postId } = request.params

    return reply.send(`Course ID: ${id}; Post ID: ${postId}`)
  })
}
