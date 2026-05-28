import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import getUsers from '../../lib/getUsers.js'

const users = getUsers()

test('users index', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/users'
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(users[0].username))
  assert.match(res.payload, new RegExp(users[0].email))
  assert.match(res.payload, new RegExp(users[50].username))
  assert.match(res.payload, new RegExp(users[50].email))
  assert.match(res.payload, new RegExp(users.at(-1).username))
  assert.match(res.payload, new RegExp(users.at(-1).email))
})

test('get user', async (t) => {
  const app = await build(t)
  const userIndex = 75

  const res = await app.inject({
    method: 'GET',
    url: `/users/${users[userIndex].id}`
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(users[userIndex].username))
  assert.match(res.payload, new RegExp(users[userIndex].email))
})

test('undefined user', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/users/undefined'
  })

  assert.equal(res.statusCode, 404)
  assert.equal(res.payload, 'User not found')
})
