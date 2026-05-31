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
  assert.match(res.payload, /Добавить пользователя/)
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

test('create user redirects to users list and normalizes email', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/users',
    payload: 'username=New+User&email=Test%40Example.COM',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, '/users')

  const list = await app.inject({
    method: 'GET',
    url: '/users',
  })

  assert.equal(list.statusCode, 200)
  assert.match(list.payload, /New User/)
  assert.match(list.payload, /test@example.com/)
})
