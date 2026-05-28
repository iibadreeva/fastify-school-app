import sanitizeHtml from 'sanitize-html'

export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    // return { root: true }
    return reply.view('index', { root: true })
  })
  fastify.post('/', async function (request, res) {
    res.send('POST /users')
  })

  const data = {
    phones: ['+12345678', '3434343434', '234-56-78'],
    domains: ['example.com', 'hexlet.io'],
  }
  fastify.get('/phones', (req, res) => {
    res.send(data.phones)
  })

  fastify.get('/test', (req, res) => {
    // test?name=inna
    const { name } = req.query;
    if(!name){
      res.send('Hello World!')
    }
    res.send(`Hello ${name}!`)
  })

  fastify.get('/test/:id', (req, res) => {
    // http://localhost:3000/test/%3Cscript%3Ealert('attack!')%3B%3C%2Fscript%3E
    const { id } = req.params;
    res.type('html')

    const clean = sanitizeHtml(id, {
      // 1. Разрешаем только конкретные теги (тег <main> будет удален)
      allowedTags: [ 'h2', 'a', 'p' ],

      // 2. Разрешаем конкретные атрибуты для конкретных тегов
      allowedAttributes: {
        'a': [ 'href', 'target' ]
      },

      // 3. Разрешаем только безопасные протоколы для ссылок (javascript: заблокируется)
      allowedSchemes: [ 'http', 'https', 'mailto' ]
    });

    res.send(`<h1>Course ID: ${clean}</h1>`)
  })

  fastify.get('/courses', (req, res) => {
    const state = {
      courses: [
        {
          id: 1,
          title: 'JS: Массивы',
          description: 'Курс про массивы в JavaScript',
        },
        {
          id: 2,
          title: 'JS: Функции',
          description: 'Курс про функции в JavaScript',
        },
      ],
    }
    const data = {
      courses: state.courses, // Где-то хранится список курсов
      header: 'Курсы по программированию',
    }
    return res.view('curses', data)
  })

  fastify.get('/courses/:id/lessons/:postId', (req, res) => {
    // /courses/5/lessons/10
    const { id, postId } = req.params;
    res.send(`Course ID: ${id}; Post ID: ${postId}`)
  })
}
