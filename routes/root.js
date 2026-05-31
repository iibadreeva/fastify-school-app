import sanitizeHtml from 'sanitize-html'

export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
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
      allowedTags: [ 'h2', 'a', 'p' ],
      allowedAttributes: {
        'a': [ 'href', 'target' ]
      },
      allowedSchemes: [ 'http', 'https', 'mailto' ]
    });

    res.send(`<h1>Course ID: ${clean}</h1>`)
  })
}
