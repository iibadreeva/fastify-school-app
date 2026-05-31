import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('responses include Cache-Control: no-store', async (t) => {
  const app = await build(t)

  const res = await app.inject({ url: '/' })

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['cache-control'], 'no-store')
})
