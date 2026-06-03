import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('demo page sets signed demo_visits cookie and increments counter', async (t) => {
  const app = await build(t)

  const first = await app.inject({ url: '/demo' })

  assert.equal(first.statusCode, 200)
  assert.match(first.headers['set-cookie'], /demo_visits=/)
  assert.match(first.payload, /Визитов на этой странице/)
  assert.match(first.payload, /<strong>1<\/strong>/)

  const cookieHeader = first.headers['set-cookie']

  const second = await app.inject({
    url: '/demo',
    headers: { cookie: cookieHeader },
  })

  assert.equal(second.statusCode, 200)
  assert.match(second.payload, /<strong>2<\/strong>/)
})
