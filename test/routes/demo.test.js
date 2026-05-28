import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('demo page renders pug template', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/demo'
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.headers['content-type'], /text\/html/)
  assert.match(res.payload, /Школьное приложение/)
  assert.match(res.payload, /Pug/)
})
